import { processNotificationEvent } from './processNotificationEvent.job'
import { invalidateContextualDocumentsHandler } from './invalidateContextualDocuments.job'

export const processDomainEventHandler = async (payload: any): Promise<void> => {
  const eventName = payload?.event_name || payload?.eventName || payload?.data?.event_name
  console.log(`[processDomainEvent.job] Processing domain event: ${eventName}`)
  
  if (!eventName) {
    console.warn(`[processDomainEvent.job] Payload missing valid event_name, skipping:`, payload)
    return
  }

  // 1. Process Notifications (Legacy behavior)
  try {
    await processNotificationEvent(payload)
  } catch (err) {
    console.error(`[processDomainEvent.job] Notification processing failed:`, err)
  }

  // 2. Process specific domain event subscribers
  try {
    if (eventName === 'PROPOSAL_RETURNED') {
      await invalidateContextualDocumentsHandler(payload)
    }
  } catch (err) {
    console.error(`[processDomainEvent.job] Domain subscriber failed:`, err)
    throw err // Throw to mark the outbox event as failed for retries
  }
}
