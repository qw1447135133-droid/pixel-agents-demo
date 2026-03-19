import { logger } from '../core/Logger'

export interface RetryOptions {
  maxAttempts?: number
  delay?: number
  backoff?: boolean
  onRetry?: (attempt: number, error: Error) => void | Promise<void>
  shouldRetry?: (error: Error, attempt: number) => boolean
}

const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms))

/**
 * 指数退避重试
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = true,
    onRetry,
    shouldRetry
  } = options

  let lastError: Error

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      // 检查是否应该重试
      if (shouldRetry && !shouldRetry(lastError, attempt)) {
        logger.warn(`Should not retry on attempt ${attempt}, giving up`, {
          error: lastError.message
        })
        throw lastError
      }

      // 最后一次尝试，直接抛出
      if (attempt === maxAttempts) {
        logger.error(`All ${maxAttempts} attempts failed`, {
          error: lastError.message
        })
        break
      }

      // 计算延迟时间（指数退避）
      const currentDelay = backoff ? delay * Math.pow(2, attempt - 1) : delay

      logger.warn(
        `Attempt ${attempt}/${maxAttempts} failed, retrying in ${currentDelay}ms`,
        {
          error: lastError.message,
          nextAttempt: attempt + 1
        }
      )

      // 调用 onRetry 回调
      if (onRetry) {
        await onRetry(attempt, lastError)
      }

      await sleep(currentDelay)
    }
  }

  throw lastError!
}

/**
 * 重试装饰器
 */
export function Retryable(options: RetryOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      return withRetry(() => originalMethod.apply(this, args), options)
    }

    return descriptor
  }
}
