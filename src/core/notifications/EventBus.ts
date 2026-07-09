import { EventPayload } from './types'
import { RuleEngine } from './RuleEngine'
import { AuditQueue } from '@/audit/services/AuditQueue'

export class EventBus {
  /**
   * Publishes an event to the Notification Framework.
   * Business logic should call this INSTEAD of sending emails directly.
   */
  public static async publish(payload: EventPayload) {
    console.log(`[EventBus] Publishing ${payload.eventName}`)
    
    // 1. Audit the event
    AuditQueue.push({
      action: payload.eventName,
      entityType: payload.module,
      entityId: payload.entityId ?? 'system',
      userId: payload.userId ?? 'system',
      details: JSON.stringify(payload.data)
    })

    // 2. Process async without blocking the main thread
    RuleEngine.processEvent(payload).catch(err => {
      console.error(`[EventBus] Error processing event ${payload.eventName}:`, err)
    })
  }
}
