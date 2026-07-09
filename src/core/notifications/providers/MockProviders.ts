import { ChannelProvider } from './ProviderInterface'
import { NotificationJob } from '../types'

export class MockEmailProvider implements ChannelProvider {
  channel = 'EMAIL'
  async deliver(job: NotificationJob) {
    console.log(`[Email] Sending to ${job.recipientContact}:`, job.payload)
    return { success: true }
  }
}

export class MockSmsProvider implements ChannelProvider {
  channel = 'SMS'
  async deliver(job: NotificationJob) {
    console.log(`[SMS] Sending to ${job.recipientContact}:`, job.payload)
    return { success: true }
  }
}

export class MockPushProvider implements ChannelProvider {
  channel = 'PUSH'
  async deliver(job: NotificationJob) {
    console.log(`[Push] Sending to ${job.recipientContact}:`, job.payload)
    return { success: true }
  }
}

export class InAppProvider implements ChannelProvider {
  channel = 'IN_APP'
  async deliver(job: NotificationJob) {
    // InApp notifications are "delivered" instantly when saved to the DB.
    // The `<NotificationCenter />` reads directly from NotificationLog.
    console.log(`[InApp] Delivered to User ${job.recipientContact}`)
    return { success: true }
  }
}
