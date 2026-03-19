import { TaskTimeoutError, AppError } from '../../shared/types'
import { logger } from '../core/Logger'

/**
 * Promise 超时包装
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutError?: Error
): Promise<T> {
  let timeoutHandle: NodeJS.Timeout

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      const error = timeoutError || new Error(`Operation timed out after ${timeoutMs}ms`)
      logger.warn('Operation timed out', { timeoutMs, error: error.message })
      reject(error)
    }, timeoutMs)
  })

  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    clearTimeout(timeoutHandle!)
  }
}

/**
 * 任务超时包装
 */
export function withTaskTimeout<T>(
  promise: Promise<T>,
  taskId: string,
  timeoutMs: number
): Promise<T> {
  return withTimeout(promise, timeoutMs, new TaskTimeoutError(taskId))
}

/**
 * 超时装饰器
 */
export function Timeout(timeoutMs: number, errorFactory?: () => Error) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const promise = originalMethod.apply(this, args)
      const error = errorFactory ? errorFactory() : undefined
      return withTimeout(promise, timeoutMs, error)
    }

    return descriptor
  }
}
