/**
 * Job / Background Worker configuration.
 * All magic numbers related to background jobs live here.
 * Per config-management.md: never hardcode these inline.
 */
export const jobConfig = {
  // Outbox poller — rows to process per poll cycle
  outboxBatchSize: Number(process.env.OUTBOX_BATCH_SIZE ?? 20),

  // Outbox — max delivery attempts before marking FAILED
  outboxMaxAttempts: Number(process.env.OUTBOX_MAX_ATTEMPTS ?? 5),

  // BullMQ queue name (matches the worker consumer)
  bullmqQueueName: process.env.BULLMQ_QUEUE_NAME ?? 'background-jobs',

  // background_job table: rows to process per JobQueue.processNext() call
  jobQueueBatchSize: Number(process.env.JOB_QUEUE_BATCH_SIZE ?? 10),

  // Prod only: BullMQ repeatable safety-net polls orphaned outbox rows every N ms
  // Primary trigger is EventBus.publish() → dispatch('pollOutbox') — this is the fallback
  outboxSafetyNetIntervalMs: Number(process.env.OUTBOX_SAFETY_NET_INTERVAL_MS ?? 60_000),
} as const
