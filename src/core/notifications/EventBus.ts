import { EventPayload } from './types'
import { Container } from '@/infrastructure/di/Container'
import { auditQueue as AuditQueue } from '@/infrastructure/di/Container'

export class EventBus {
  /**
   * Publishes an event to the Notification Framework.
   * Business logic should call this INSTEAD of sending emails directly.
   */
  public static async publish(payload: EventPayload) {
    console.log(`[EventBus] Publishing ${payload.event_name}`)
    
    // 1. Audit the event
    AuditQueue.push({
      event_type: payload.event_name,
      module_name: payload.module,
      entity_id: payload.entity_id ? String(payload.entity_id) : null,
      user_id: payload.user_id ?? 'system',
      remarks: JSON.stringify(payload.data)
    })

    // OTPs get the highest priority in the queue (1)
    const isOtp = payload.data?.type === 'OTP'
    
    // 2. Process async via JobDispatcher (adhering to background-jobs.md)
    Container.jobDispatcher.dispatch('processNotificationEvent', payload, { priority: isOtp ? 1 : 3 }).catch(err => {
      console.error(`[EventBus] Error dispatching event job ${payload.event_name}:`, err)
    })
  }
}
