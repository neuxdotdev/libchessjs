import { EventEmitter } from 'events'
import { performance } from 'perf_hooks'
import { createWriteStream, WriteStream } from 'fs'
import { join } from 'path'

interface LogEntry {
  timestamp: string
  level: string
  module: string
  traceId: string
  message: string
  data?: any
  metadata?: any
  duration?: number
}

interface LogTransport {
  write(entry: LogEntry): void
}

class ConsoleTransport implements LogTransport {
  private colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    bgRed: '\x1b[41m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m',
  }

  write(entry: LogEntry): void {
    const color = this.getColor(entry.level)
    const levelStr = `${color}[${entry.level}]${this.colors.reset}`
    const timestamp = entry.timestamp
    const moduleStr = `${this.colors.cyan}[${entry.module}]${this.colors.reset}`
    const traceStr = `${this.colors.magenta}[${entry.traceId}]${this.colors.reset}`

    let logString = `${levelStr} ${timestamp} ${moduleStr} ${traceStr} - ${entry.message}`

    if (entry.data) {
      logString += `\n${color}╰─ Data:${this.colors.reset} ${entry.data}`
    }

    if (entry.metadata) {
      logString += `\n${color}╰─ Meta:${this.colors.reset} ${entry.metadata}`
    }

    if (entry.duration) {
      logString += `\n${color}╰─ Duration:${this.colors.reset} ${entry.duration}ms`
    }

    const consoleMethod = this.getConsoleMethod(entry.level)
    ;(console as any)[consoleMethod](logString)
  }

  private getColor(level: string): string {
    const colors: { [key: string]: string } = {
      FATAL: this.colors.bgRed + this.colors.white,
      ERROR: this.colors.red,
      WARN: this.colors.yellow,
      INFO: this.colors.green,
      DEBUG: this.colors.blue,
      TRACE: this.colors.magenta,
      PERF: this.colors.cyan,
    }
    return colors[level] || this.colors.white
  }

  private getConsoleMethod(level: string): string {
    const methods: { [key: string]: string } = {
      FATAL: 'error',
      ERROR: 'error',
      WARN: 'warn',
      INFO: 'info',
      DEBUG: 'debug',
      TRACE: 'log',
      PERF: 'log',
    }
    return methods[level] || 'log'
  }
}

class FileTransport implements LogTransport {
  private stream: WriteStream
  private logQueue: string[] = []
  private isWriting = false

  constructor(logDir: string = './logs', filename?: string) {
    const date = new Date().toISOString().split('T')[0]
    const logFile = filename || `app-${date}.log`
    const logPath = join(logDir, logFile)

    this.stream = createWriteStream(logPath, { flags: 'a', encoding: 'utf8' })
  }

  write(entry: LogEntry): void {
    const logLine =
      JSON.stringify({
        ...entry,
        timestamp: new Date().toISOString(),
      }) + '\n'

    this.logQueue.push(logLine)
    this.processQueue()
  }

  private processQueue(): void {
    if (this.isWriting || this.logQueue.length === 0) return

    this.isWriting = true
    const logLine = this.logQueue.shift()!

    this.stream.write(logLine, err => {
      if (err) {
        console.error('Failed to write log to file:', err)
      }
      this.isWriting = false
      this.processQueue()
    })
  }

  close(): void {
    this.stream.end()
  }
}

class DebugLogger extends EventEmitter {
  private transports: LogTransport[] = [new ConsoleTransport()]
  private logLevels = {
    FATAL: 0,
    ERROR: 1,
    WARN: 2,
    INFO: 3,
    DEBUG: 4,
    TRACE: 5,
  }

  private currentLevel = 5
  private moduleName: string
  private logHistory: LogEntry[] = []
  private maxHistorySize = 10000
  private performanceThreshold = 1000

  constructor(moduleName: string = 'App') {
    super()
    this.moduleName = moduleName
    this.setMaxListeners(100)
  }

  addTransport(transport: LogTransport): void {
    this.transports.push(transport)
  }

  removeTransport(transport: LogTransport): void {
    const index = this.transports.indexOf(transport)
    if (index > -1) {
      this.transports.splice(index, 1)
    }
  }

  setLogLevel(level: number | string): void {
    if (typeof level === 'string') {
      const levelKey = level.toUpperCase() as keyof typeof this.logLevels
      this.currentLevel = this.logLevels[levelKey] ?? 3
    } else {
      this.currentLevel = Math.max(0, Math.min(5, level))
    }
  }

  setPerformanceThreshold(threshold: number): void {
    this.performanceThreshold = threshold
  }

  private generateTraceId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  private safeStringify(obj: any): string {
    try {
      const seen = new WeakSet()
      return JSON.stringify(
        obj,
        (key, value) => {
          if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) return '[Circular]'
            seen.add(value)
          }
          if (value instanceof Error) {
            return {
              name: value.name,
              message: value.message,
              stack: value.stack,
              cause: value.cause,
            }
          }
          if (value instanceof Map) {
            return Object.fromEntries(value)
          }
          if (value instanceof Set) {
            return Array.from(value)
          }
          if (value instanceof Buffer) {
            return value.toString('hex')
          }
          return value
        },
        2
      )
    } catch {
      return '[Unserializable Data]'
    }
  }

  private createLogEntry(
    level: string,
    message: string,
    data?: any,
    metadata?: any,
    duration?: number
  ): LogEntry {
    const timestamp = new Date().toISOString()
    const traceId = this.generateTraceId()

    const entry: LogEntry = {
      timestamp,
      level,
      module: this.moduleName,
      traceId,
      message,
      data: data ? this.safeStringify(data) : undefined,
      metadata: metadata ? this.safeStringify(metadata) : undefined,
      duration,
    }

    this.addToHistory(entry)
    this.emit('log', entry)

    if (level === 'FATAL' || level === 'ERROR') {
      this.emit('error', entry)
    }

    if (level === 'PERF' && duration && duration > this.performanceThreshold) {
      this.emit('slow_performance', entry)
    }

    return entry
  }

  private addToHistory(entry: LogEntry): void {
    this.logHistory.push(entry)
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift()
    }
  }

  private shouldLog(level: string): boolean {
    const levelNum = this.logLevels[level as keyof typeof this.logLevels]
    return levelNum <= this.currentLevel
  }

  fatal(message: string, error?: any, metadata?: any): void {
    const entry = this.createLogEntry('FATAL', message, error, metadata)
    this.transports.forEach(transport => transport.write(entry))
    this.emit('fatal', entry)
  }

  error(message: string, error?: any, metadata?: any): void {
    if (this.shouldLog('ERROR')) {
      const entry = this.createLogEntry('ERROR', message, error, metadata)
      this.transports.forEach(transport => transport.write(entry))
    }
  }

  warn(message: string, data?: any, metadata?: any): void {
    if (this.shouldLog('WARN')) {
      const entry = this.createLogEntry('WARN', message, data, metadata)
      this.transports.forEach(transport => transport.write(entry))
    }
  }

  info(message: string, data?: any, metadata?: any): void {
    if (this.shouldLog('INFO')) {
      const entry = this.createLogEntry('INFO', message, data, metadata)
      this.transports.forEach(transport => transport.write(entry))
    }
  }

  debug(message: string, data?: any, metadata?: any): void {
    if (this.shouldLog('DEBUG')) {
      const entry = this.createLogEntry('DEBUG', message, data, metadata)
      this.transports.forEach(transport => transport.write(entry))
    }
  }

  trace(message: string, data?: any, metadata?: any): void {
    if (this.shouldLog('TRACE')) {
      const entry = this.createLogEntry('TRACE', message, data, metadata)
      this.transports.forEach(transport => transport.write(entry))
    }
  }

  performance(methodName: string, startTime: number, metadata?: any): number {
    const duration = Date.now() - startTime
    const entry = this.createLogEntry('PERF', `${methodName} completed`, null, metadata, duration)
    this.transports.forEach(transport => transport.write(entry))
    return duration
  }

  measure<T>(methodName: string, fn: () => T, metadata?: any): T {
    const startTime = Date.now()
    try {
      const result = fn()
      if (result instanceof Promise) {
        return result.then(res => {
          this.performance(methodName, startTime, metadata)
          return res
        }) as T
      }
      this.performance(methodName, startTime, metadata)
      return result
    } catch (error: unknown) {
      let errMsg: string
      if (error instanceof Error) {
        errMsg = error.message
      } else {
        errMsg = String(error)
      }
      this.performance(methodName, startTime, { ...metadata, error: errMsg })
      throw error
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logHistory]
  }

  clearLogs(): void {
    this.logHistory = []
  }

  createChildLogger(moduleName: string): DebugLogger {
    const childLogger = new DebugLogger(`${this.moduleName}.${moduleName}`)
    childLogger.setLogLevel(this.currentLevel)
    childLogger.transports = [...this.transports]
    return childLogger
  }

  getStats(): { total: number; byLevel: Record<string, number>; byModule: Record<string, number> } {
    const byLevel: Record<string, number> = {}
    const byModule: Record<string, number> = {}

    this.logHistory.forEach(entry => {
      byLevel[entry.level] = (byLevel[entry.level] || 0) + 1
      byModule[entry.module] = (byModule[entry.module] || 0) + 1
    })

    return {
      total: this.logHistory.length,
      byLevel,
      byModule,
    }
  }
}

class ErrorHandler extends EventEmitter {
  private logger: DebugLogger
  private customHandlers: Map<string, (error: Error, context?: any) => void> = new Map()
  private fallbackHandler?: (error: Error) => void
  private retryStrategies: Map<string, (error: Error, attempt: number) => number> = new Map()

  constructor(logger: DebugLogger) {
    super()
    this.logger = logger
    this.setupGlobalHandlers()
    this.setupDefaultRetryStrategies()
  }

  private setupGlobalHandlers(): void {
    process.on('uncaughtException', (error: Error) => {
      this.logger.fatal('Uncaught Exception', error)
      this.executeFallback(error)
    })

    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      this.logger.fatal('Unhandled Rejection', reason)
      this.executeFallback(reason instanceof Error ? reason : new Error(String(reason)))
    })

    process.on('warning', (warning: Error) => {
      this.logger.warn('Process Warning', warning)
    })
  }

  private setupDefaultRetryStrategies(): void {
    this.retryStrategies.set('default', (error: Error, attempt: number) => {
      return Math.min(1000 * Math.pow(2, attempt), 30000)
    })

    this.retryStrategies.set('network', (error: Error, attempt: number) => {
      return Math.min(500 * Math.pow(2, attempt), 10000)
    })

    this.retryStrategies.set('database', (error: Error, attempt: number) => {
      return Math.min(2000 * Math.pow(2, attempt), 60000)
    })
  }

  registerHandler(errorType: string, handler: (error: Error, context?: any) => void): void {
    this.customHandlers.set(errorType, handler)
  }

  setFallbackHandler(handler: (error: Error) => void): void {
    this.fallbackHandler = handler
  }

  setRetryStrategy(errorType: string, strategy: (error: Error, attempt: number) => number): void {
    this.retryStrategies.set(errorType, strategy)
  }

  handleError(error: Error, context?: any): void {
    const errorType = error.constructor.name
    const handler = this.customHandlers.get(errorType)

    this.emit('error_handled', { error, context, handler: handler ? 'custom' : 'default' })

    if (handler) {
      this.logger.debug(`Executing custom handler for ${errorType}`, error)
      handler(error, context)
    } else {
      this.logger.error(`Unhandled error type: ${errorType}`, error, context)
      this.executeFallback(error)
    }
  }

  private executeFallback(error: Error): void {
    if (this.fallbackHandler) {
      this.fallbackHandler(error)
    } else {
      process.exit(1)
    }
  }

  async retry<T>(
    operation: () => Promise<T>,
    options: {
      maxAttempts?: number
      strategy?: string
      onRetry?: (error: Error, attempt: number, delay: number) => void
    } = {}
  ): Promise<T> {
    const { maxAttempts = 3, strategy = 'default', onRetry } = options
    let lastError: Error

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error

        if (attempt === maxAttempts) {
          this.logger.error(`All retry attempts failed after ${maxAttempts} attempts`, lastError)
          throw lastError
        }

        const retryStrategy =
          this.retryStrategies.get(strategy) || this.retryStrategies.get('default')!
        const delay = retryStrategy(lastError, attempt)

        this.logger.warn(`Retry attempt ${attempt}/${maxAttempts} after ${delay}ms`, lastError)

        if (onRetry) {
          onRetry(lastError, attempt, delay)
        }

        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError!
  }

  wrapAsync<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    options?: { name?: string; retry?: any }
  ): (...args: T) => Promise<R> {
    const funcName = options?.name || fn.name || 'anonymous'

    return async (...args: T): Promise<R> => {
      const startTime = Date.now()
      try {
        this.logger.trace(`Executing async function: ${funcName}`)

        if (options?.retry) {
          return await this.retry(() => fn(...args), options.retry)
        }

        const result = await fn(...args)
        this.logger.performance(funcName, startTime)
        return result
      } catch (error) {
        this.logger.error(`Async function failed: ${funcName}`, error)
        this.handleError(error as Error, { function: funcName, args })
        throw error
      }
    }
  }

  wrapSync<T extends any[], R>(
    fn: (...args: T) => R,
    options?: { name?: string }
  ): (...args: T) => R {
    const funcName = options?.name || fn.name || 'anonymous'

    return (...args: T): R => {
      const startTime = Date.now()
      try {
        this.logger.trace(`Executing sync function: ${funcName}`)
        const result = fn(...args)
        this.logger.performance(funcName, startTime)
        return result
      } catch (error) {
        this.logger.error(`Sync function failed: ${funcName}`, error)
        this.handleError(error as Error, { function: funcName, args })
        throw error
      }
    }
  }

  createCircuitBreaker<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    options: {
      failureThreshold?: number
      resetTimeout?: number
      name?: string
    } = {}
  ): (...args: T) => Promise<R> {
    const { failureThreshold = 5, resetTimeout = 60000, name = fn.name || 'circuit' } = options

    let failures = 0
    let lastFailureTime = 0
    let state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'

    return async (...args: T): Promise<R> => {
      if (state === 'OPEN') {
        if (Date.now() - lastFailureTime > resetTimeout) {
          state = 'HALF_OPEN'
          this.logger.info(`Circuit breaker ${name} moving to HALF_OPEN`)
        } else {
          throw new Error(`Circuit breaker ${name} is OPEN`)
        }
      }

      try {
        const result = await fn(...args)

        if (state === 'HALF_OPEN') {
          state = 'CLOSED'
          failures = 0
          this.logger.info(`Circuit breaker ${name} reset to CLOSED`)
        }

        return result
      } catch (error) {
        failures++
        lastFailureTime = Date.now()

        if (failures >= failureThreshold) {
          state = 'OPEN'
          this.logger.error(`Circuit breaker ${name} opened after ${failures} failures`, error)
        }

        throw error
      }
    }
  }
}

class DebugManager {
  private static instance: DebugManager
  private loggers: Map<string, DebugLogger> = new Map()
  private errorHandlers: Map<string, ErrorHandler> = new Map()
  private fileTransports: Map<string, FileTransport> = new Map()

  private constructor() {}

  static getInstance(): DebugManager {
    if (!DebugManager.instance) {
      DebugManager.instance = new DebugManager()
    }
    return DebugManager.instance
  }

  getLogger(moduleName: string = 'Main'): DebugLogger {
    if (!this.loggers.has(moduleName)) {
      const logger = new DebugLogger(moduleName)
      this.loggers.set(moduleName, logger)
    }
    return this.loggers.get(moduleName)!
  }

  getErrorHandler(moduleName: string = 'Main'): ErrorHandler {
    if (!this.errorHandlers.has(moduleName)) {
      const logger = this.getLogger(moduleName)
      const errorHandler = new ErrorHandler(logger)
      this.errorHandlers.set(moduleName, errorHandler)
    }
    return this.errorHandlers.get(moduleName)!
  }

  addFileTransport(logDir: string, moduleName?: string, filename?: string): FileTransport {
    const transport = new FileTransport(logDir, filename)

    if (moduleName) {
      const logger = this.getLogger(moduleName)
      logger.addTransport(transport)
    } else {
      this.loggers.forEach(logger => logger.addTransport(transport))
    }

    this.fileTransports.set(logDir, transport)
    return transport
  }

  setGlobalLogLevel(level: number | string): void {
    this.loggers.forEach(logger => logger.setLogLevel(level))
  }

  setGlobalPerformanceThreshold(threshold: number): void {
    this.loggers.forEach(logger => logger.setPerformanceThreshold(threshold))
  }

  getAllLogs(): { [module: string]: LogEntry[] } {
    const logs: { [module: string]: LogEntry[] } = {}
    this.loggers.forEach((logger, moduleName) => {
      logs[moduleName] = logger.getLogs()
    })
    return logs
  }

  getStats(): { [module: string]: any } {
    const stats: { [module: string]: any } = {}
    this.loggers.forEach((logger, moduleName) => {
      stats[moduleName] = logger.getStats()
    })
    return stats
  }

  clearAllLogs(): void {
    this.loggers.forEach(logger => logger.clearLogs())
  }

  closeFileTransports(): void {
    this.fileTransports.forEach(transport => transport.close())
  }
}

export { DebugLogger, ErrorHandler, DebugManager, ConsoleTransport, FileTransport }
export type { LogEntry, LogTransport }
export default DebugManager.getInstance()
