import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, serverError } from '../_lib'
import { EventBus } from '@/notifications/EventBus'

export async function POST(req: NextRequest) {
  try {
    const { user_id } = await req.json()

    // 1. Ensure event registry exists
    const event_name = 'TEST_EVENT'
    let event = await db.event_registry.findUnique({ where: { event_name } })
    if (!event) {
      event = await db.event_registry.create({
        data: { event_name, module: 'system', description: 'A test event' }
      })
    }

    // 2. Ensure template exists
    let template = await db.notification_template.findUnique({ where: { code: 'TEST_IN_APP' } })
    if (!template) {
      template = await db.notification_template.create({
        data: {
          code: 'TEST_IN_APP',
          channel: 'IN_APP',
          subject: 'Test Event Triggered',
          body: 'Hello {{user.name}}, this is a test event from module {{module}}!'
        }
      })
    }

    // 3. Ensure rule exists mapping event to template
    let rule = await db.notification_rule.findFirst({
      where: { event_id: event.id, template_id: template.id }
    })
    if (!rule) {
      rule = await db.notification_rule.create({
        data: {
          event_id: event.id,
          template_id: template.id,
          recipient_resolver: 'EventUser' // Resolves to the user in payload.user_id
        }
      })
    }

    // 4. Fire the event!
    await EventBus.publish({
      event_name: 'TEST_EVENT',
      module: 'system',
      user_id,
      data: {
        user: { name: 'Demo user' },
        module: 'Notification Engine'
      }
    })

    return ok({ success: true, message: 'Event published' })
  } catch (e: any) {
    return serverError('Failed', e.message)
  }
}
