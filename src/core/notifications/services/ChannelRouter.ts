import { NotificationQueue } from './NotificationQueue'
import { NotificationConfig } from '../NotificationConfig'

export class ChannelRouter {
  public static async dispatch(
    event_id: string,
    event_name: string,
    channel: string,
    priority: string,
    contactInfo: string,
    recipient_id: string | undefined,
    payload: Record<string, any>
  ) {
    // 1. Create a notification_log entry (status PENDING)
    const log = await NotificationConfig.storage.createNotificationLog({
      event_id: event_name,
      recipient_id,
      recipient_contact: contactInfo,
      channel,
      payload: JSON.stringify(payload),
      status: 'PENDING',
      priority,
    })

    // 2. Check user preferences to see if we should abort
    if (recipient_id) {
      const isOptedOut = await NotificationConfig.storage.isUserOptedOut(recipient_id, channel)
      if (isOptedOut) {
        await NotificationConfig.storage.updateNotificationLog(log.id, {
          status: 'CANCELLED',
          failure_reason: 'user opted out'
        })
        return
      }
    }

    // 3. Mark as QUEUED and push to our queue mechanism
    await NotificationConfig.storage.updateNotificationLog(log.id, {
      status: 'QUEUED'
    })

    NotificationQueue.push({
      logId: log.id,
      channel: channel as 'EMAIL' | 'SMS' | 'IN_APP' | 'PUSH',
      recipient_contact: contactInfo,
      payload,
      retry_count: 0
    })
  }
}
