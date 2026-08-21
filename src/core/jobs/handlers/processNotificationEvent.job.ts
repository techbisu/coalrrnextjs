import { EventPayload } from '../../notifications/types'
import { RecipientResolver } from '../../notifications/services/RecipientResolver'
import { TemplateEngine } from '../../notifications/services/TemplateEngine'
import { ChannelRouter } from '../../notifications/services/ChannelRouter'
import { NotificationConfig } from '../../notifications/NotificationConfig'

export const processNotificationEvent = async (payload: EventPayload): Promise<void> => {
  const eventName = payload?.event_name || (payload as any)?.eventName || (payload as any)?.data?.event_name;
  console.log(`[processNotificationEvent.job] Processing event: ${eventName}`)
  
  if (!eventName) {
    console.warn(`[processNotificationEvent.job] Payload missing valid event_name, skipping processing:`, payload);
    return;
  }
  
  // 1. Find the event registry via decoupled storage
  const event = await NotificationConfig.storage.getEventRegistryWithRules(eventName)

  if (!event) {
    console.warn(`[processNotificationEvent.job] No registered event found for ${payload.event_name}`)
    return
  }

  // 2. Process all rules
  for (const rule of event.rules) {
    if (!rule.template.is_active) continue

    // 3. Resolve Recipients
    const recipients = await RecipientResolver.resolve(rule.recipient_resolver, payload)

    // 4. Compile Templates & Route
    for (const recipient of recipients) {
      if (!recipient.id) continue;

      // Check User Preference
      const isOptedOut = await NotificationConfig.storage.isUserOptedOut(recipient.id, rule.template.channel);
      if (isOptedOut) {
        console.log(`[processNotificationEvent.job] Skipped ${rule.template.channel} for user ${recipient.id} due to preference.`);
        continue;
      }

      let contactInfo = ''
      if (rule.template.channel === 'EMAIL' && recipient.email) contactInfo = recipient.email
      if (rule.template.channel === 'SMS' && recipient.phone) contactInfo = recipient.phone
      if (rule.template.channel === 'IN_APP') contactInfo = recipient.id
      if (rule.template.channel === 'PUSH' && recipient.id) contactInfo = recipient.id

      if (!contactInfo) continue

      const compiledSubject = rule.template.subject ? TemplateEngine.compile(rule.template.subject, payload.data) : null
      const compiledBody = TemplateEngine.compile(rule.template.body, payload.data)

      // 5. Dispatch to Channel Router
      await ChannelRouter.dispatch(
        event.id,
        event.event_name,
        rule.template.channel,
        rule.priority,
        contactInfo,
        recipient.id,
        { subject: compiledSubject, body: compiledBody, eventData: payload.data }
      )
    }
  }
}
