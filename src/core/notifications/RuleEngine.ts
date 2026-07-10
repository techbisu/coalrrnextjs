import { EventPayload } from './types'
import { RecipientResolver } from './services/RecipientResolver'
import { TemplateEngine } from './services/TemplateEngine'
import { ChannelRouter } from './services/ChannelRouter'
import { NotificationConfig } from './NotificationConfig'

export class RuleEngine {
  public static async processEvent(payload: EventPayload) {
    // 1. Find the event registry via decoupled storage
    const event = await NotificationConfig.storage.getEventRegistryWithRules(payload.event_name)

    if (!event) {
      console.warn(`[RuleEngine] No registered event found for ${payload.event_name}`)
      return
    }

    // 2. Process all rules
    for (const rule of event.rules) {
      if (!rule.template.is_active) continue

      // 3. Resolve Recipients
      const recipients = await RecipientResolver.resolve(rule.recipient_resolver, payload)

      // 4. Compile Templates & Route
      for (const recipient of recipients) {
        let contactInfo = ''
        if (rule.template.channel === 'EMAIL' && recipient.email) contactInfo = recipient.email
        if (rule.template.channel === 'SMS' && recipient.phone) contactInfo = recipient.phone
        if (rule.template.channel === 'IN_APP') contactInfo = recipient.id
        if (rule.template.channel === 'PUSH' && recipient.id) contactInfo = recipient.id // assuming we look up push tokens by ID later

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
          recipient.id, // user ID if known
          { subject: compiledSubject, body: compiledBody, eventData: payload.data }
        )
      }
    }
  }
}
