import { logger } from './../logger/logger.js'
/** Delay async operation in ms */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
/** Exponential backoff with retry and logging */
export async function exponentialBackoff<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      const delay = baseDelay * 2 ** attempt
      const errMsg = error instanceof Error ? error.message : String(error)
      logger.warn(`Attempt ${attempt + 1} failed (${errMsg}), retrying in ${delay}ms`)
      if (attempt < maxRetries - 1) await sleep(delay)
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error(`Unknown error after ${maxRetries} retries`)
}
export class RateLimiter {
  private requests: number[] = []
  constructor(private windowMs: number, private maxRequests: number) {}
  async acquire(): Promise<void> {
    const now = Date.now()
    this.requests = this.requests.filter(t => t > now - this.windowMs)
    if (this.requests.length >= this.maxRequests) {
      const waitTime = this.requests[0] + this.windowMs - now
      logger.debug(`Rate limit hit, waiting ${waitTime}ms`)
      await sleep(Math.max(waitTime, 0))
      return this.acquire()
    }
    this.requests.push(now)
  }
  getRemaining(): number {
    const now = Date.now()
    this.requests = this.requests.filter(t => t > now - this.windowMs)
    return Math.max(this.maxRequests - this.requests.length, 0)
  }
}
export class Cache<T> {
  private store = new Map<string, { value: T; expiry: number }>()
  constructor(private defaultTTL = 5 * 60 * 1000) {}
  set(key: string, value: T, ttl?: number): void {
    const expiry = Date.now() + (ttl ?? this.defaultTTL)
    this.store.set(key, { value, expiry })
    this.cleanup()
  }
  get(key: string): T | undefined {
    const item = this.store.get(key)
    if (!item || Date.now() > item.expiry) {
      this.store.delete(key)
      return undefined
    }
    return item.value
  }
  delete(key: string): boolean {
    return this.store.delete(key)
  }
  clear(): void {
    this.store.clear()
  }
  private cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.store.entries()) {
      if (now > item.expiry) this.store.delete(key)
    }
  }
  size(): number {
    this.cleanup()
    return this.store.size
  }
}
export class URLBuilder {
  private path: string[] = []
  private params: Record<string, string> = {}
  constructor(private baseURL: string = 'https://api.chess.com/pub') {}
  addPath(segment: string): this {
    if (segment) this.path.push(segment.replace(/^\/+|\/+$/g, ''))
    return this
  }
  addParam(key: string, value: string | number): this {
    if (key != null && value != null) this.params[key] = String(value)
    return this
  }
  addParams(params: Record<string, string | number>): this {
    for (const [k, v] of Object.entries(params)) this.addParam(k, v)
    return this
  }
  build(): string {
    const pathString = this.path.length ? '/' + this.path.join('/') : ''
    const url = `${this.baseURL}${pathString}`
    const search = new URLSearchParams(this.params).toString()
    return search ? `${url}?${search}` : url
  }
  toString(): string {
    return this.build()
  }
}
export class ResponseHandler {
  static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      throw await this.parseError(response)
    }
    try {
      return (await response.json()) as T
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.error('Failed to parse JSON response', { msg, status: response.status })
      throw new Error(`Invalid JSON: ${msg}`)
    }
  }

  private static async parseError(response: Response): Promise<Error> {
    let message = `HTTP ${response.status}: ${response.statusText}`
    let details: Record<string, any> = {}

    try {
      const body: unknown = await response.json()

      // pastikan aman sebelum diakses
      if (typeof body === 'object' && body !== null && 'message' in body) {
        message = (body as any).message ?? message
        details = body as Record<string, any>
      } else {
        details = { status: response.status, statusText: response.statusText }
      }
    } catch {
      details = { status: response.status, statusText: response.statusText }
    }

    const error = new Error(message)
    Object.assign(error, { status: response.status, details })
    logger.error('API request failed', details)
    return error
  }
}
export async function processInBatches<T, R>(
  items: readonly T[],
  processor: (item: T) => Promise<R>,
  batchSize = 10,
  delayBetween = 1000
): Promise<R[]> {
  const results: R[] = []

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    logger.debug(`Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} items)`)

    const settled = await Promise.allSettled(batch.map(processor))
    for (const r of settled) {
      if (r.status === 'fulfilled') results.push(r.value)
      else logger.error('Batch item failed', { reason: (r as PromiseRejectedResult).reason })
    }

    if (i + batchSize < items.length) await sleep(delayBetween)
  }

  return results
}

export const isString = (v: unknown): v is string => typeof v === 'string'
export const isNumber = (v: unknown): v is number => typeof v === 'number' && !Number.isNaN(v)
export const isObject = (v: unknown): v is Record<string, any> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
export const isArray = Array.isArray

export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result: Record<string, any> = { ...target }

  for (const [key, value] of Object.entries(source)) {
    if (isObject(value)) {
      result[key] = deepMerge(result[key] ?? {}, value)
    } else if (value !== undefined) {
      result[key] = value
    }
  }

  return result as T
}

export function generateUserAgent(): string {
  return `openchess-sdk/1.0.0 (+https://github.com/neuxdotdev/openchess-sdk)`
}

export const defaultRateLimiter = new RateLimiter(10_000, 50)
