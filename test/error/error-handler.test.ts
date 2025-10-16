import DebugManager, {
  DebugLogger,
  ErrorHandler,
  ConsoleTransport,
  FileTransport,
  LogEntry,
  LogTransport,
} from '../../utils/error/error-handler.js'
console.log('=== TEST 1: Basic Logger Functionality ===')
const logger = DebugManager.getLogger('TestModule')

logger.setLogLevel('DEBUG')

logger.fatal('This is a FATAL message', new Error('Critical failure'), { userId: 123 })
logger.error('This is an ERROR message', new Error('Something went wrong'), { action: 'login' })
logger.warn('This is a WARN message', { reason: 'Deprecated API' })
logger.info('This is an INFO message', { status: 'success' })
logger.debug('This is a DEBUG message', { debugData: 'some value' })
logger.trace('This is a TRACE message', { detailed: 'trace information' })

// Test 2: Performance Monitoring
console.log('\n=== TEST 2: Performance Monitoring ===')
const startTime = Date.now()

// Sync performance measurement
const result = logger.measure(
  'syncCalculation',
  () => {
    let sum = 0
    for (let i = 0; i < 1000000; i++) {
      sum += i
    }
    return sum
  },
  { iterations: 1000000 }
)

console.log('Sync result:', result)

// Async performance measurement
async function asyncOperation(): Promise<string> {
  return new Promise(resolve => {
    setTimeout(() => resolve('Async operation completed'), 100)
  })
}

logger
  .measure('asyncOperation', asyncOperation, { timeout: 200 })
  .then(result => console.log('Async result:', result))
  .catch(error => console.error('Async error:', error))
logger.performance('manualOperation', startTime, { custom: 'metadata' })
console.log('\n=== TEST 3: Error Handler Functionality ===')
const errorHandler = DebugManager.getErrorHandler('TestModule')

// Custom error classes for testing
class NetworkError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message)
    this.name = 'NetworkError'
  }
}

class DatabaseError extends Error {
  constructor(message: string, public query: string) {
    super(message)
    this.name = 'DatabaseError'
  }
}

// Register custom error handlers dengan type safety
errorHandler.registerHandler('NetworkError', (error: Error, context?: any) => {
  const networkError = error as NetworkError
  console.log(
    `Custom NetworkError handler: ${networkError.message}, Status: ${networkError.statusCode}`
  )
})

errorHandler.registerHandler('DatabaseError', (error: Error, context?: any) => {
  const databaseError = error as DatabaseError
  console.log(
    `Custom DatabaseError handler: ${databaseError.message}, Query: ${databaseError.query}`
  )
})

// Test error handling
const networkError = new NetworkError('Connection timeout', 504)
const databaseError = new DatabaseError('Table not found', 'SELECT * FROM users')

errorHandler.handleError(networkError, { endpoint: '/api/users' })
errorHandler.handleError(databaseError, { db: 'main' })
errorHandler.handleError(new Error('Unknown error type'), { context: 'test' })

// Test 4: Retry Mechanism
console.log('\n=== TEST 4: Retry Mechanism ===')
let attemptCount = 0

async function unreliableOperation(): Promise<string> {
  attemptCount++
  if (attemptCount < 3) {
    throw new NetworkError('Temporary failure', 503)
  }
  return 'Operation succeeded after retries'
}

errorHandler
  .retry(unreliableOperation, {
    maxAttempts: 5,
    strategy: 'network',
    onRetry: (error: Error, attempt: number, delay: number) => {
      console.log(`Retry ${attempt}: ${error.message}, waiting ${delay}ms`)
    },
  })
  .then(result => {
    console.log('Retry result:', result)
  })
  .catch(error => {
    console.error('Retry failed:', error.message)
  })

// Test 5: Circuit Breaker
console.log('\n=== TEST 5: Circuit Breaker ===')
let failureCount = 0

const unstableService = async (): Promise<string> => {
  failureCount++
  if (failureCount % 3 !== 0) {
    // Fail 2 out of 3 times
    throw new Error('Service unavailable')
  }
  return 'Service response'
}

const circuitProtectedService = errorHandler.createCircuitBreaker(unstableService, {
  failureThreshold: 2,
  resetTimeout: 5000,
  name: 'UnstableService',
})

// Test circuit breaker
async function testCircuitBreaker() {
  for (let i = 0; i < 10; i++) {
    try {
      const result = await circuitProtectedService()
      console.log(`Call ${i + 1}: ${result}`)
    } catch (error) {
      console.log(`Call ${i + 1}: ${(error as Error).message}`)
    }
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}

testCircuitBreaker()

// Test 6: Function Wrapping
console.log('\n=== TEST 6: Function Wrapping ===')

// Wrap async function
const wrappedAsync = errorHandler.wrapAsync(
  async (id: number): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 50))
    if (id < 0) {
      throw new Error('Invalid ID')
    }
    return `User ${id}`
  },
  { name: 'getUser', retry: { maxAttempts: 2 } }
)

// Wrap sync function
const wrappedSync = errorHandler.wrapSync(
  (a: number, b: number): number => {
    if (b === 0) {
      throw new Error('Division by zero')
    }
    return a / b
  },
  { name: 'divide' }
)

// Test wrapped functions
wrappedAsync(1)
  .then(result => console.log('Wrapped async success:', result))
  .catch(error => console.error('Wrapped async error:', error.message))

wrappedAsync(-1)
  .then(result => console.log('Wrapped async success:', result))
  .catch(error => console.error('Wrapped async error:', error.message))

try {
  const result = wrappedSync(10, 2)
  console.log('Wrapped sync success:', result)
} catch (error) {
  console.error('Wrapped sync error:', (error as Error).message)
}

try {
  wrappedSync(10, 0)
} catch (error) {
  console.error('Wrapped sync error:', (error as Error).message)
}

// Test 7: File Transport
console.log('\n=== TEST 7: File Transport ===')
const fileTransport = DebugManager.addFileTransport('./test-logs', 'TestModule', 'test.log')

// Log some messages with file transport
logger.info('This message should go to file', { fileTest: true })
logger.error('Error message for file', new Error('File transport test'))

// Test 8: Child Loggers
console.log('\n=== TEST 8: Child Loggers ===')
const childLogger = logger.createChildLogger('SubModule')
childLogger.info('Message from child logger', { parent: 'TestModule' })

// Test 9: Statistics
console.log('\n=== TEST 9: Statistics ===')
const stats = logger.getStats()
console.log('Logger statistics:', stats)

const allStats = DebugManager.getStats()
console.log('All modules statistics:', allStats)

// Test 10: Log History
console.log('\n=== TEST 10: Log History ===')
const logs = logger.getLogs()
console.log(`Total logs in history: ${logs.length}`)
if (logs.length > 0) {
  console.log('Latest log entry:', {
    level: logs[logs.length - 1].level,
    message: logs[logs.length - 1].message,
    timestamp: logs[logs.length - 1].timestamp,
  })
}

// Test 11: Custom Transport
console.log('\n=== TEST 11: Custom Transport ===')
class CustomTransport implements LogTransport {
  write(entry: LogEntry): void {
    console.log(`[CUSTOM TRANSPORT] ${entry.level}: ${entry.message} | Trace: ${entry.traceId}`)
  }
}

const customTransport = new CustomTransport()
logger.addTransport(customTransport)
logger.info('This message goes to custom transport')

// Test 12: Event Listening
console.log('\n=== TEST 12: Event Listening ===')
logger.on('log', (entry: LogEntry) => {
  if (entry.level === 'ERROR') {
    console.log(`[EVENT LISTENER] Error logged: ${entry.message}`)
  }
})

logger.on('slow_performance', (entry: LogEntry) => {
  console.log(`[EVENT LISTENER] Slow performance detected: ${entry.message} (${entry.duration}ms)`)
})

// Trigger events
logger.error('This should trigger event listener')
logger.performance('slowOperation', Date.now() - 1500, { threshold: 1000 })

// Test 13: Error Handler Events
console.log('\n=== TEST 13: Error Handler Events ===')
errorHandler.on('error_handled', (data: any) => {
  console.log(
    `[ERROR HANDLER EVENT] Error handled: ${data.error.message}, Handler: ${data.handler}`
  )
})

errorHandler.handleError(new Error('Test event error'))

// Test 14: Global Configuration
console.log('\n=== TEST 14: Global Configuration ===')
DebugManager.setGlobalLogLevel('INFO')
DebugManager.setGlobalPerformanceThreshold(500)

const globalLogger = DebugManager.getLogger('GlobalTest')
globalLogger.debug('This debug message should NOT appear due to global log level')
globalLogger.info('This info message should appear')
globalLogger.performance('fastOperation', Date.now() - 600, { test: 'threshold' })

// Test 15: Multiple Modules
console.log('\n=== TEST 15: Multiple Modules ===')
const authLogger = DebugManager.getLogger('Auth')
const dbLogger = DebugManager.getLogger('Database')
const apiLogger = DebugManager.getLogger('API')

authLogger.info('User logged in', { userId: 456 })
dbLogger.info('Database query executed', { table: 'users', operation: 'SELECT' })
apiLogger.info('API request processed', { endpoint: '/users', method: 'GET' })

// Test 16: Stress Test
console.log('\n=== TEST 16: Stress Test ===')
function stressTest() {
  const stressLogger = DebugManager.getLogger('StressTest')

  for (let i = 0; i < 100; i++) {
    stressLogger.info(`Stress test message ${i}`, { iteration: i, timestamp: Date.now() })
  }

  console.log('Stress test completed - check log history size')
}

stressTest()

// Test 17: Error Recovery
console.log('\n=== TEST 17: Error Recovery ===')
const recoveryHandler = DebugManager.getErrorHandler('RecoveryTest')

// Test fallback handler
recoveryHandler.setFallbackHandler((error: Error) => {
  console.log(`[FALLBACK HANDLER] Recovering from error: ${error.message}`)
  // Don't exit process in test
})

recoveryHandler.handleError(new Error('Unrecoverable error (simulated)'))

// Test 18: Complex Data Logging
console.log('\n=== TEST 18: Complex Data Logging ===')
const complexData = {
  user: {
    id: 123,
    name: 'John Doe',
    preferences: new Map([
      ['theme', 'dark'],
      ['language', 'en'],
    ]),
    roles: new Set(['admin', 'user']),
    nested: {
      deep: {
        deeper: {
          value: 'very deep',
        },
      },
    },
  },
  timestamp: new Date(),
  buffer: Buffer.from('test buffer'),
  circularReference: {} as any,
}

// Create circular reference
complexData.circularReference.self = complexData.circularReference

logger.info('Complex data structure', complexData)

// Test 19: Memory Usage Monitoring
console.log('\n=== TEST 19: Memory Usage Monitoring ===')
const memoryLogger = DebugManager.getLogger('MemoryMonitor')

function logMemoryUsage() {
  const memoryUsage = process.memoryUsage()
  memoryLogger.info('Memory usage report', {
    rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
    external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`,
  })
}

logMemoryUsage()

// Test 20: Cleanup and Final Stats
console.log('\n=== TEST 20: Final Statistics and Cleanup ===')

// Get final statistics
const finalStats = DebugManager.getStats()
console.log('Final statistics for all modules:')
Object.keys(finalStats).forEach(moduleName => {
  const stats = finalStats[moduleName]
  console.log(`  ${moduleName}: ${stats.total} logs, Levels:`, stats.byLevel)
})

// Clear logs for specific logger
logger.clearLogs()
console.log(`Logger history cleared. Remaining logs: ${logger.getLogs().length}`)

// Close file transports
setTimeout(() => {
  DebugManager.closeFileTransports()
  console.log('File transports closed')
  console.log('\n=== ALL TESTS COMPLETED ===')
}, 2000)

// Export for external testing
export { logger, errorHandler, fileTransport, CustomTransport, NetworkError, DatabaseError }
