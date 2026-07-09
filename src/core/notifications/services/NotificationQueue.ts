import { NotificationJob } from '../types'
import { db } from '@/lib/db'
import { MockEmailProvider, MockSmsProvider, MockPushProvider, InAppProvider } from '../providers/MockProviders'

const providers = {
  EMAIL: new MockEmailProvider(),
  SMS: new MockSmsProvider(),
  PUSH: new MockPushProvider(),
  IN_APP: new InAppProvider(),
}

class NotificationQueueManager {
  private queue: NotificationJob[] = []
  private isProcessing = false
  private MAX_RETRIES = 3

  public push(job: NotificationJob) {
    this.queue.push(job)
    this.processQueue()
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return
    this.isProcessing = true

    while (this.queue.length > 0) {
      const job = this.queue.shift()!
      try {
        const provider = providers[job.channel as keyof typeof providers]
        if (!provider) throw new Error(`No provider for channel ${job.channel}`)

        const result = await provider.deliver(job)

        if (result.success) {
          await db.notificationLog.update({
            where: { id: job.logId },
            data: { status: 'DELIVERED', deliveredAt: new Date() }
          })
        } else {
          throw new Error(result.error ?? 'Provider failed')
        }
      } catch (error: any) {
        if (job.retryCount < this.MAX_RETRIES) {
          job.retryCount++
          await db.notificationLog.update({
            where: { id: job.logId },
            data: { retryCount: job.retryCount, status: 'QUEUED', failureReason: error.message }
          })
          // Requeue for retry (in a real system, use delayed backoff)
          this.queue.push(job)
        } else {
          await db.notificationLog.update({
            where: { id: job.logId },
            data: { status: 'FAILED', failureReason: error.message }
          })
        }
      }
    }

    this.isProcessing = false
  }
}

// Global instance to survive HMR in Next.js development
const globalForNotifications = globalThis as unknown as { notificationQueue: NotificationQueueManager | undefined }
export const NotificationQueue = globalForNotifications.notificationQueue ?? new NotificationQueueManager()

if (process.env.NODE_ENV !== 'production') {
  globalForNotifications.notificationQueue = NotificationQueue
}
