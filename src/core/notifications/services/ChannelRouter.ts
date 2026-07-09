import { db } from '@/lib/db'
import { NotificationQueue } from './NotificationQueue'

export class ChannelRouter {
  public static async dispatch(
    eventId: string,
    eventName: string,
    channel: string,
    priority: string,
    contactInfo: string,
    recipientId: string | undefined,
    payload: Record<string, any>
  ) {
    // 1. Create a NotificationLog entry (status PENDING)
    const log = await db.notificationLog.create({
      data: {
        eventId: eventName,
        recipientId,
        recipientContact: contactInfo,
        channel,
        payload: JSON.stringify(payload),
        status: 'PENDING',
        priority,
      }
    })

    // 2. Check user preferences to see if we should abort
    if (recipientId) {
      const pref = await db.notificationPreference.findUnique({
        where: { userId_channel: { userId: recipientId, channel } }
      })
      if (pref && !pref.isEnabled) {
        await db.notificationLog.update({
          where: { id: log.id },
          data: { status: 'CANCELLED', failureReason: 'User opted out' }
        })
        return
      }
    }

    // 3. Mark as QUEUED and push to our queue mechanism
    await db.notificationLog.update({
      where: { id: log.id },
      data: { status: 'QUEUED' }
    })

    NotificationQueue.push({
      logId: log.id,
      channel: channel as 'EMAIL' | 'SMS' | 'IN_APP' | 'PUSH',
      recipientContact: contactInfo,
      payload,
      retryCount: 0
    })
  }
}
