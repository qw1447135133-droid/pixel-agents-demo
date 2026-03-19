// 简单的日志系统（暂不引入 Winston，先保持简单）
// 后续可以升级为 Winston

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: number
  level: LogLevel
  message: string
  meta?: any
}

class Logger {
  private logs: LogEntry[] = []
  private maxLogs = 1000
  private listeners: ((entry: LogEntry) => void)[] = []

  debug(message: string, meta?: any) {
    this.log('debug', message, meta)
  }

  info(message: string, meta?: any) {
    this.log('info', message, meta)
  }

  warn(message: string, meta?: any) {
    this.log('warn', message, meta)
  }

  error(message: string, error?: Error, meta?: any) {
    this.log('error', message, { error: error?.stack, ...meta })
  }

  performance(operation: string, duration: number, meta?: any) {
    this.info(`Performance: ${operation}`, { operation, duration, ...meta })
  }

  private log(level: LogLevel, message: string, meta?: any) {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      meta
    }

    this.logs.push(entry)
    
    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    // 输出到控制台
    const consoleMethod = level === 'debug' ? console.debug :
                          level === 'info' ? console.info :
                          level === 'warn' ? console.warn :
                          console.error
    consoleMethod(`[${new Date(entry.timestamp).toLocaleTimeString()}] [${level.toUpperCase()}]`, message, meta || '')

    // 通知监听器
    this.listeners.forEach(listener => listener(entry))
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level)
    }
    return [...this.logs]
  }

  clearLogs() {
    this.logs = []
  }

  addListener(listener: (entry: LogEntry) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }
}

// 导出单例
export const logger = new Logger()
