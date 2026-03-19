import { logger } from './Logger'

// 重试工具
export interface RetryOptions {
  maxAttempts?: number
  delay?: number
  backoff?: boolean
  onRetry?: (attempt: number, error: Error) => void | Promise<void>
  shouldRetry?: (error: Error, attempt: number) => boolean
}

const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms))

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

      if (shouldRetry && !shouldRetry(lastError, attempt)) {
        logger.warn(`Retry: Should not retry on attempt ${attempt}, giving up`, {
          error: lastError.message
        })
        throw lastError
      }

      if (attempt === maxAttempts) {
        logger.error(`Retry: All ${maxAttempts} attempts failed`, {
          error: lastError.message
        })
        break
      }

      const currentDelay = backoff ? delay * Math.pow(2, attempt - 1) : delay

      logger.warn(`Retry: Attempt ${attempt}/${maxAttempts} failed, retrying in ${currentDelay}ms`, {
        error: lastError.message,
        nextAttempt: attempt + 1
      })

      if (onRetry) {
        await onRetry(attempt, lastError)
      }

      await sleep(currentDelay)
    }
  }

  throw lastError!
}

// 超时工具
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutError?: Error
): Promise<T> {
  let timeoutHandle: NodeJS.Timeout

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      const error = timeoutError || new Error(`Operation timed out after ${timeoutMs}ms`)
      logger.warn('Timeout: Operation timed out', { timeoutMs, error: error.message })
      reject(error)
    }, timeoutMs)
  })

  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    clearTimeout(timeoutHandle!)
  }
}

// 简单的 uuid 生成（备用）
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}
