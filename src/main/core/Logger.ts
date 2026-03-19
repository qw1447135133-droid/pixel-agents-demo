import winston from 'winston'
import path from 'path'
import { app } from 'electron'

// 确保日志目录存在
const logDir = path.join(app.getPath('userData'), 'logs')

export class Logger {
  private static instance: Logger
  private logger: winston.Logger

  private constructor() {
    this.logger = winston.createLogger({
      level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'StarCraw' },
      transports: [
        // 错误日志
        new winston.transports.File({
          filename: path.join(logDir, 'error.log'),
          level: 'error'
        }),
        // 所有日志
        new winston.transports.File({
          filename: path.join(logDir, 'combined.log')
        })
      ]
    })

    // 开发环境同时输出到控制台
    if (process.env.NODE_ENV === 'development') {
      this.logger.add(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      )
    }
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  info(message: string, meta?: any): void {
    this.logger.info(message, meta)
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta)
  }

  error(message: string, error?: Error, meta?: any): void {
    this.logger.error(message, {
      error: error?.stack,
      ...meta
    })
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta)
  }

  performance(operation: string, duration: number, meta?: any): void {
    this.logger.info('Performance metric', {
      operation,
      duration,
      timestamp: Date.now(),
      ...meta
    })
  }
}

// 导出单例
export const logger = Logger.getInstance()
