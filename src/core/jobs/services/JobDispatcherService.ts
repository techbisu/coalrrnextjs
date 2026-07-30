import { jobConfig } from '@/core/config/job.config'
import { env } from '@/core/config/env'

// Import Handlers
import { auditLogHandler } from '../handlers/auditLog.job'
import { expireCaptchasHandler } from '../handlers/expireCaptchas.job'
import { processNotificationEvent } from '../handlers/processNotificationEvent.job'
import { dispatchNotification } from '../handlers/dispatchNotification.job'
import { pollOutboxHandler } from '../handlers/pollOutbox.job'

// Job Registry — add new handlers here, never use magic strings at call sites
const jobHandlers: Record<string, (payload: any) => Promise<void>> = {
  auditLog:                auditLogHandler,
  expireCaptchas:          expireCaptchasHandler,
  processNotificationEvent: processNotificationEvent,
  dispatchNotification:    dispatchNotification,
  pollOutbox:              pollOutboxHandler,
}

import type { Queue } from 'bullmq'

/**
 * globalThis guard — one BullMQ Queue connection per process, not per cold
 * start / hot-reload. Safe in serverless and traditional Node environments.
 */
const globalForQueue = globalThis as unknown as {
  _bullmqQueue:           Queue | undefined
  _bullmqSafetyNetSeeded: boolean | undefined
}

export class JobDispatcherService {
  /**
   * Dispatches a job via the appropriate backend.
   *
   * NODE_ENV=development  → executes the handler synchronously in-process (Option C).
   * NODE_ENV=production   → enqueues to BullMQ / Redis (Option B).
   *
   * Callers never check NODE_ENV — that branching lives here only.
   */
  async dispatch(
    jobName: string,
    payload: any,
    options?: { priority?: number }
  ): Promise<void> {
    const handler = jobHandlers[jobName]
    if (!handler) {
      console.warn(`[JobDispatcherService] No handler registered for job: ${jobName}`)
      return
    }

    if (env.NODE_ENV === 'development') {
      // Option C: immediate in-process execution — no Redis required
      console.log(`[JobDispatcherService] Executing '${jobName}' synchronously (dev)`)
      try {
        await handler(payload)
      } catch (error) {
        console.error(`[JobDispatcherService] Job '${jobName}' failed:`, error)
      }
    } else {
      // Option B: enqueue to BullMQ (Redis-backed) in production
      const queue = await this.getOrCreateQueue()
      await queue.add(jobName, payload, options)
    }
  }

  /**
   * Returns the shared BullMQ Queue, creating it once per process.
   * Also registers a 60-second repeatable safety-net `pollOutbox` job the
   * first time the queue is initialised in production — catches any orphaned
   * outbox rows that were not polled by their trigger dispatch.
   */
  private async getOrCreateQueue(): Promise<Queue> {
    if (!globalForQueue._bullmqQueue) {
      const { Queue } = await import('bullmq')

      globalForQueue._bullmqQueue = new Queue(jobConfig.bullmqQueueName, {
        connection: { url: env.REDIS_URL ?? 'redis://localhost:6379' },
      })

      // Safety-net repeatable job: poll orphaned outbox rows every 60s
      if (!globalForQueue._bullmqSafetyNetSeeded) {
        await globalForQueue._bullmqQueue.add(
          'pollOutbox',
          {},
          {
            repeat: { every: jobConfig.outboxSafetyNetIntervalMs },
            jobId: 'pollOutbox-safety-net',  // stable ID prevents duplicate repeats
          }
        )
        globalForQueue._bullmqSafetyNetSeeded = true
        console.log('[JobDispatcherService] Registered pollOutbox safety-net repeatable job')
      }
    }

    return globalForQueue._bullmqQueue!
  }
}

export const jobDispatcher = new JobDispatcherService()
