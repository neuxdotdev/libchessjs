export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LoggerOptions {
  level?: LogLevel
  prefix?: string
  enableColors?: boolean
}


export class Logger {
  private level: LogLevel
  private prefix: string
  private enableColors: boolean

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? LogLevel.INFO
    this.prefix = options.prefix ?? 'ChessSDK'
    this.enableColors = options.enableColors ?? true
  }

  private getTimestamp(): string {
    return new Date().toISOString()
  }

  private formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = this.getTimestamp()
    const prefix = this.prefix ? `[${this.prefix}]` : ''

    let formattedMessage = `${timestamp} ${prefix} [${level}] ${message}`

    if (args.length > 0) {
      try {
        const extraArgs = args
          .map(arg => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)))
          .join(' ')
        formattedMessage += ` - ${extraArgs}`
      } catch {
        formattedMessage += ` - ${args.join(' ')}`
      }
    }

    return formattedMessage
  }

  private colorize(message: string, colorCode: string): string {
    if (!this.enableColors) return message
    return `\x1b[${colorCode}m${message}\x1b[0m`
  }

  error(message: string, ...args: any[]): void {
    if (this.level >= LogLevel.ERROR) {
      const formatted = this.formatMessage('ERROR', message, ...args)
      console.error(this.colorize(formatted, '31')) // Red
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.level >= LogLevel.WARN) {
      const formatted = this.formatMessage('WARN', message, ...args)
      console.warn(this.colorize(formatted, '33')) // Yellow
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.level >= LogLevel.INFO) {
      const formatted = this.formatMessage('INFO', message, ...args)
      console.info(this.colorize(formatted, '36')) // Cyan
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.level >= LogLevel.DEBUG) {
      const formatted = this.formatMessage('DEBUG', message, ...args)
      console.debug(this.colorize(formatted, '90')) // Gray
    }
  }

  // Method untuk performance monitoring
  time<T>(label: string, operation: () => T): T {
    if (this.level >= LogLevel.DEBUG) {
      const start = performance.now()
      try {
        return operation()
      } finally {
        const end = performance.now()
        this.debug(`Timing ${label}: ${(end - start).toFixed(2)}ms`)
      }
    } else {
      return operation()
    }
  }

  async timeAsync<T>(label: string, operation: () => Promise<T>): Promise<T> {
    if (this.level >= LogLevel.DEBUG) {
      const start = performance.now()
      try {
        return await operation()
      } finally {
        const end = performance.now()
        this.debug(`Timing ${label}: ${(end - start).toFixed(2)}ms`)
      }
    } else {
      return await operation()
    }
  }

  // Setter untuk level logging
  setLevel(level: LogLevel): void {
    this.level = level
  }

  // Create child logger dengan prefix tambahan
  child(additionalPrefix: string): Logger {
    return new Logger({
      level: this.level,
      prefix: `${this.prefix}:${additionalPrefix}`,
      enableColors: this.enableColors,
    })
  }
}

// Default logger instance
export const logger = new Logger()

// Utility functions untuk quick logging
export const log = {
  error: (message: string, ...args: any[]) => logger.error(message, ...args),
  warn: (message: string, ...args: any[]) => logger.warn(message, ...args),
  info: (message: string, ...args: any[]) => logger.info(message, ...args),
  debug: (message: string, ...args: any[]) => logger.debug(message, ...args),
}
