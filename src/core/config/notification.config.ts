export const notificationConfig = {
  maxRetries: Number(process.env.NOTIFICATION_MAX_RETRIES || 3),
  retryBackoffMs: Number(process.env.NOTIFICATION_RETRY_BACKOFF_MS || 5000),
  defaultPriority: 'NORMAL'
} as const;
