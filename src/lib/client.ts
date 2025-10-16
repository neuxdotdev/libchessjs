import { Logger, LogLevel } from '../utils/logger/logger.js'
import { validate } from './../utils/core/validator.js'
import {
  ApiError,
  ApiEvent,
  ApiResponse,
  CacheStrategy,
  ClientConfig,
  HttpMethod,
  RateLimitInfo,
  RequestConfig,
  RequestMetrics,
} from './types/src/common.js'
interface CacheEntry {
  data: any
  timestamp: number
  headers: Record<string, string>
  etag?: string
  lastModified?: string
}
class ChessApiError extends Error implements ApiError {
  constructor(
    message: string,
    public code: number,
    public status: number,
    public url: string,
    public timestamp: number,
    public details?: Record<string, any>,
    stack?: string
  ) {
    super(message)
    this.name = 'ChessApiError'
    if (stack) {
      this.stack = stack
    }
  }
}
export class ChessComHttpClient {
  private baseUrl: string
  private cache = new Map<string, CacheEntry>()
  private metrics: RequestMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    rateLimitedRequests: 0,
    averageResponseTime: 0,
    totalResponseTime: 0,
    errorsByCode: {},
    requestsByEndpoint: {},
  }
  private logger: Logger
  private eventListeners: Array<(event: ApiEvent) => void> = []
  mapLogLevel = (level?: string | LogLevel): LogLevel => {
    if (typeof level === 'number') return level
    switch (level?.toLowerCase()) {
      case 'error':
        return LogLevel.ERROR
      case 'warn':
        return LogLevel.WARN
      case 'debug':
        return LogLevel.DEBUG
      default:
        return LogLevel.INFO
    }
  }
  constructor(
    private config: ClientConfig = {
      baseURL: 'https://api.chess.com/pub',
      timeout: 30000,
      cache: { enabled: true, ttl: 300000, strategy: CacheStrategy.NETWORK_FIRST },
      retries: 3,
      retryDelay: 1000,
      rateLimit: { maxRequests: 10, perMilliseconds: 60000 },
      headers: {},
      logger: { enabled: true, level: 'info' },
      events: { enabled: false, listeners: [] },
    }
  ) {
    this.baseUrl = config.baseURL
    if (config.events?.enabled && config.events.listeners) {
      this.eventListeners = config.events.listeners
    }
    this.logger = new Logger({
      level: this.mapLogLevel(config.logger?.level),
    })
  }
  private emitEvent(event: ApiEvent): void {
    if (this.config.events?.enabled) {
      this.eventListeners.forEach(listener => {
        try {
          listener(event)
        } catch (error) {
          this.logger.error('Event listener error:', error)
        }
      })
    }
  }
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  private getCacheKey(endpoint: string, params?: Record<string, any>): string {
    const key = `chesscom:${endpoint}`
    return params ? `${key}:${JSON.stringify(params)}` : key
  }
  private getCached<T>(key: string): { data: T; headers: Record<string, string> } | null {
    if (!this.config.cache?.enabled) return null
    const cached = this.cache.get(key)
    if (!cached) {
      this.metrics.cacheMisses++
      return null
    }
    const now = Date.now()
    if (now - cached.timestamp > (this.config.cache.ttl || 300000)) {
      this.cache.delete(key)
      this.metrics.cacheMisses++
      return null
    }
    this.metrics.cacheHits++
    return { data: cached.data, headers: cached.headers }
  }
  private setCached(key: string, data: any, headers: Record<string, string>): void {
    if (!this.config.cache?.enabled) return
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      headers,
      etag: headers.etag,
      lastModified: headers['last-modified'],
    }
    this.cache.set(key, entry)
  }
  private calculateBackoffDelay(attempt: number): number {
    const baseDelay = this.config.retryDelay || 1000
    return baseDelay * Math.pow(2, attempt)
  }
  private shouldRetry(status: number): boolean {
    return status === 429 || status >= 500
  }
  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    retries = this.config.retries || 3
  ): Promise<Response> {
    let lastError: Error = new Error('Max retries exceeded')
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        if (attempt > 0) {
          const backoffDelay = this.calculateBackoffDelay(attempt - 1)
          await this.delay(backoffDelay)
        }
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)
        const fetchOptions: RequestInit = {
          ...options,
          signal: controller.signal,
          headers: {
            'User-Agent': 'ChessCom-SDK/1.0 (TypeScript)',
            Accept: 'application/json',
            'Accept-Encoding': 'gzip',
            ...this.config.headers,
            ...(options.headers as Record<string, string>),
          },
        }
        const response = await fetch(url, fetchOptions)
        clearTimeout(timeoutId)
        this.metrics.totalRequests++
        if (response.status === 429) {
          this.metrics.rateLimitedRequests++
          const retryAfter = parseInt(response.headers.get('Retry-After') || '60')
          await this.delay(retryAfter * 1000)
          continue
        }
        if (this.shouldRetry(response.status) && attempt < retries - 1) {
          continue
        }
        return response
      } catch (error) {
        lastError = error as Error
        this.metrics.failedRequests++
        if (error instanceof Error && error.name === 'AbortError') {
          continue
        }
        if (attempt === retries - 1) break
      }
    }
    throw lastError
  }
  async get<T>(
    endpoint: string,
    useCache = true,
    requestConfig: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const startTime = Date.now()
    const url = `${this.baseUrl}${endpoint}`
    const cacheKey = this.getCacheKey(endpoint)
    this.emitEvent({
      type: 'api_request',
      timestamp: startTime,
      source: 'ChessComHttpClient',
      method: HttpMethod.GET,
      url,
      headers: { ...this.config.headers },
      params: {},
    })
    try {
      validate.params({ endpoint })
    } catch (error) {
      this.logger.error('Endpoint validation failed:', error)
      throw error
    }
    if (!this.metrics.requestsByEndpoint[endpoint]) {
      this.metrics.requestsByEndpoint[endpoint] = 0
    }
    this.metrics.requestsByEndpoint[endpoint]++
    if (useCache) {
      const cached = this.getCached<T>(cacheKey)
      if (cached) {
        const responseTime = Date.now() - startTime
        this.metrics.totalResponseTime += responseTime
        this.metrics.averageResponseTime =
          this.metrics.totalResponseTime / Math.max(this.metrics.totalRequests, 1)
        this.emitEvent({
          type: 'cache_hit',
          timestamp: Date.now(),
          source: 'ChessComHttpClient',
          key: cacheKey,
          duration: responseTime,
        })
        return {
          data: cached.data,
          headers: { ...cached.headers, 'x-cache': 'HIT' },
          status: 200,
          url,
          timestamp: Date.now(),
          fromCache: true,
        }
      }
    }
    try {
      const response = await this.fetchWithRetry(url, {
        method: 'GET',
      })
      const responseTime = Date.now() - startTime
      this.metrics.totalResponseTime += responseTime
      this.metrics.averageResponseTime =
        this.metrics.totalResponseTime / Math.max(this.metrics.totalRequests, 1)
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        const apiError = new ChessApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          response.status,
          url,
          Date.now(),
          { responseBody: errorText }
        )
        if (!this.metrics.errorsByCode[response.status]) {
          this.metrics.errorsByCode[response.status] = 0
        }
        this.metrics.errorsByCode[response.status]++
        this.emitEvent({
          type: 'api_error',
          timestamp: Date.now(),
          source: 'ChessComHttpClient',
          error: apiError,
          url,
          method: HttpMethod.GET,
        })
        throw apiError
      }
      const data = (await response.json()) as T
      this.metrics.successfulRequests++
      const headers: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        headers[key] = value
      })
      const rateLimitInfo: RateLimitInfo = {
        limit: parseInt(headers['x-ratelimit-limit'] || '0'),
        remaining: parseInt(headers['x-ratelimit-remaining'] || '0'),
        reset: parseInt(headers['x-ratelimit-reset'] || '0'),
        window: parseInt(headers['x-ratelimit-window'] || '60000'),
      }
      if (useCache && response.status === 200) {
        this.setCached(cacheKey, data, headers)
      }
      const apiResponse: ApiResponse<T> = {
        data,
        headers,
        status: response.status,
        url,
        timestamp: Date.now(),
        fromCache: false,
        rateLimit: rateLimitInfo,
      }
      this.emitEvent({
        type: 'api_response',
        timestamp: Date.now(),
        source: 'ChessComHttpClient',
        status: response.status,
        duration: responseTime,
        cached: false,
        url,
      })
      if (rateLimitInfo.remaining < 10) {
        this.emitEvent({
          type: 'rate_limit',
          timestamp: Date.now(),
          source: 'ChessComHttpClient',
          limit: rateLimitInfo.limit,
          remaining: rateLimitInfo.remaining,
          reset: rateLimitInfo.reset,
          url,
        })
      }
      return apiResponse
    } catch (error) {
      const responseTime = Date.now() - startTime
      this.metrics.totalResponseTime += responseTime
      this.metrics.averageResponseTime =
        this.metrics.totalResponseTime / Math.max(this.metrics.totalRequests, 1)
      let apiError: ChessApiError
      if (error instanceof ChessApiError) {
        apiError = error
      } else if (error instanceof Error) {
        apiError = new ChessApiError(error.message, 0, 500, url, Date.now(), undefined, error.stack)
      } else {
        apiError = new ChessApiError('Unknown error occurred', 0, 500, url, Date.now())
      }
      this.emitEvent({
        type: 'api_error',
        timestamp: Date.now(),
        source: 'ChessComHttpClient',
        error: apiError,
        url,
        method: HttpMethod.GET,
      })
      throw apiError
    }
  }
  async head(endpoint: string): Promise<ApiResponse<null>> {
    const url = `${this.baseUrl}${endpoint}`
    this.emitEvent({
      type: 'api_request',
      timestamp: Date.now(),
      source: 'ChessComHttpClient',
      method: HttpMethod.HEAD,
      url,
      headers: { ...this.config.headers },
      params: {},
    })
    try {
      const response = await this.fetchWithRetry(url, { method: 'HEAD' })
      const headers: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        headers[key] = value
      })
      return {
        data: null,
        headers,
        status: response.status,
        url,
        timestamp: Date.now(),
        fromCache: false,
      }
    } catch (error) {
      let apiError: ChessApiError
      if (error instanceof Error) {
        apiError = new ChessApiError(error.message, 0, 500, url, Date.now(), undefined, error.stack)
      } else {
        apiError = new ChessApiError('Unknown error occurred', 0, 500, url, Date.now())
      }
      this.emitEvent({
        type: 'api_error',
        timestamp: Date.now(),
        source: 'ChessComHttpClient',
        error: apiError,
        url,
        method: HttpMethod.HEAD,
      })
      throw apiError
    }
  }
  clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
    }
    this.emitEvent({
      type: 'cache_clear',
      timestamp: Date.now(),
      source: 'ChessComHttpClient',
      key: pattern || 'all',
    })
  }
  updateConfig(newConfig: Partial<ClientConfig>): void {
    this.config = { ...this.config, ...newConfig }
    if (newConfig.events?.enabled && newConfig.events.listeners) {
      this.eventListeners = newConfig.events.listeners
    }
  }
  getMetrics(): RequestMetrics {
    return { ...this.metrics }
  }
  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      rateLimitedRequests: 0,
      averageResponseTime: 0,
      totalResponseTime: 0,
      errorsByCode: {},
      requestsByEndpoint: {},
    }
  }
  addEventListener(listener: (event: ApiEvent) => void): void {
    this.eventListeners.push(listener)
  }
  removeEventListener(listener: (event: ApiEvent) => void): void {
    const index = this.eventListeners.indexOf(listener)
    if (index > -1) {
      this.eventListeners.splice(index, 1)
    }
  }
  async healthCheck(): Promise<{ healthy: boolean; responseTime: number; status: number }> {
    const startTime = Date.now()
    try {
      const response = await this.get('/player/erik', false)
      const responseTime = Date.now() - startTime
      return {
        healthy: response.status === 200,
        responseTime,
        status: response.status,
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      const status = error instanceof ChessApiError ? error.status : 0
      return {
        healthy: false,
        responseTime,
        status,
      }
    }
  }
  getCacheSize(): number {
    return this.cache.size
  }
  getConfig(): ClientConfig {
    return { ...this.config }
  }
}
