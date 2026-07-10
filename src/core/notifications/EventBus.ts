import { EventPayload } from './types'
import { RuleEngine } from './RuleEngine'
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

    // 2. Process async without blocking the main thread
    RuleEngine.processEvent(payload).catch(err => {
      console.error(`[EventBus] Error processing event ${payload.event_name}:`, err)
    })
  }
}
