import { JobQueue } from '../JobQueue'

// Import Handlers
import { auditLogHandler } from '../handlers/auditLog.job'
import { expireCaptchasHandler } from '../handlers/expireCaptchas.job'
import { processNotificationEvent } from '../handlers/processNotificationEvent.job'
import { dispatchNotification } from '../handlers/dispatchNotification.job'

// Job Registry mapping
const jobHandlers: Record<string, (payload: any) => Promise<void>> = {
  'auditLog': auditLogHandler,
  'expireCaptchas': expireCaptchasHandler,
  'processNotificationEvent': processNotificationEvent,
  'dispatchNotification': dispatchNotification
}

import type { Queue } from 'bullmq'
import { env } from '../../config/env' // Fixed relative path

let backgroundQueue: Queue | null = null

export class JobDispatcherService {
  /**
   * Dispatches a job to the background queue or executes it immediately depending on the environment.
   */
  async dispatch(jobName: string, payload: any, options?: { priority?: number }): Promise<void> {
    const handler = jobHandlers[jobName]
    if (!handler) {
      console.warn(`[JobDispatcherService] No handler registered for job: ${jobName}`)
      return
    }

    if (process.env.NODE_ENV === 'development') {
      // In development, execute immediately for easy debugging
      console.log(`[JobDispatcherService] Executing job '${jobName}' synchronously (development)`)
      try {
        await handler(payload)
      } catch (error) {
        console.error(`[JobDispatcherService] Job '${jobName}' failed:`, error)
      }
    } else {
      // In production/staging, enqueue to BullMQ (Redis-backed)
      if (!backgroundQueue) {
        const { Queue } = await import('bullmq')
        backgroundQueue = new Queue('background-jobs', {
          connection: {
            url: process.env.REDIS_URL || 'redis://localhost:6379',
          }
        })
      }
      await backgroundQueue.add(jobName, payload, options)
    }
  }
}
