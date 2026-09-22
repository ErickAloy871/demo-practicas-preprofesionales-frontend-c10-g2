export interface RetryConfig {
  baseDelayMs: number
  maxDelayMs: number
  maxAttempts: number
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  baseDelayMs: 1_000,
  maxDelayMs: 8_000,
  maxAttempts: 4,
}

export function retryDelayMs(attempt: number, config: RetryConfig = DEFAULT_RETRY_CONFIG): number {
  return Math.min(config.maxDelayMs, config.baseDelayMs * 2 ** Math.max(0, attempt - 1))
}

export function isRetryable(entry: { attempts: number }, config: RetryConfig = DEFAULT_RETRY_CONFIG): boolean {
  return entry.attempts < config.maxAttempts
}