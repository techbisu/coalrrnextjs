import { db } from '@/lib/db'
import { EventPayload } from './types'
import { RecipientResolver } from './services/RecipientResolver'
import { TemplateEngine } from './services/TemplateEngine'
import { ChannelRouter } from './services/ChannelRouter'

export class RuleEngine {
  public static async processEvent(payload: EventPayload) {
    // 1. Find the event registry
    const event = await db.eventRegistry.findUnique({
      where: { eventName: payload.eventName },
      include: {
        rules: {
          where: { isActive: true },
          include: { template: true }
        }
      }
    })

    if (!event) {
      console.warn(`[RuleEngine] No registered event found for ${payload.eventName}`)
      return
    }

    // 2. Process all rules
    for (const rule of event.rules) {
      if (!rule.template.isActive) continue

      // 3. Resolve Recipients
      const recipients = await RecipientResolver.resolve(rule.recipientResolver, payload)

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
          event.eventName,
          rule.template.channel,
          rule.priority,
          contactInfo,
          recipient.id, // User ID if known
          { subject: compiledSubject, body: compiledBody, eventData: payload.data }
        )
      }
    }
  }
}
