import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, serverError } from '../_lib'
import { EventBus } from '@/notifications/EventBus'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()

    // 1. Ensure event registry exists
    const eventName = 'TEST_EVENT'
    let event = await db.eventRegistry.findUnique({ where: { eventName } })
    if (!event) {
      event = await db.eventRegistry.create({
        data: { eventName, module: 'system', description: 'A test event' }
      })
    }

    // 2. Ensure template exists
    let template = await db.notificationTemplate.findUnique({ where: { code: 'TEST_IN_APP' } })
    if (!template) {
      template = await db.notificationTemplate.create({
        data: {
          code: 'TEST_IN_APP',
          channel: 'IN_APP',
          subject: 'Test Event Triggered',
          body: 'Hello {{user.name}}, this is a test event from module {{module}}!'
        }
      })
    }

    // 3. Ensure rule exists mapping event to template
    let rule = await db.notificationRule.findFirst({
      where: { eventId: event.id, templateId: template.id }
    })
    if (!rule) {
      rule = await db.notificationRule.create({
        data: {
          eventId: event.id,
          templateId: template.id,
          recipientResolver: 'EventUser' // Resolves to the user in payload.userId
        }
      })
    }

    // 4. Fire the event!
    await EventBus.publish({
      eventName: 'TEST_EVENT',
      module: 'system',
      userId,
      data: {
        user: { name: 'Demo User' },
        module: 'Notification Engine'
      }
    })

    return ok({ success: true, message: 'Event published' })
  } catch (e: any) {
    return serverError('Failed', e.message)
  }
}
