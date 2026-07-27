import type { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'

export async function seedAuthOtpNotifications(db: PrismaClient) {
  console.log('🌱 Seeding auth OTP notifications...')

  // 1. Ensure events are registered
  const otpEvent = await db.event_registry.upsert({
    where: { event_name: 'USER_LOGIN_OTP' },
    update: {},
    create: {
      id: randomUUID(),
      event_name: 'USER_LOGIN_OTP',
      module: 'auth',
      description: 'Triggered when user logs in and requires OTP via SMS',
      updt_ts: new Date()
    }
  })

  const fallbackEvent = await db.event_registry.upsert({
    where: { event_name: 'USER_LOGIN_OTP_EMAIL_FALLBACK' },
    update: {},
    create: {
      id: randomUUID(),
      event_name: 'USER_LOGIN_OTP_EMAIL_FALLBACK',
      module: 'auth',
      description: 'Triggered when SMS OTP fails and fallback to EMAIL is required',
      updt_ts: new Date()
    }
  })

  // 2. Ensure templates are registered
  const smsTemplate = await db.notification_template.upsert({
    where: { code: 'TPL_LOGIN_OTP_SMS' },
    update: {},
    create: {
      id: randomUUID(),
      code: 'TPL_LOGIN_OTP_SMS',
      channel: 'SMS',
      subject: null,
      body: 'Your COALRR login OTP is {{otpCode}}. Valid for 10 minutes.',
      updt_ts: new Date()
    }
  })

  const emailTemplate = await db.notification_template.upsert({
    where: { code: 'TPL_LOGIN_OTP_EMAIL' },
    update: {},
    create: {
      id: randomUUID(),
      code: 'TPL_LOGIN_OTP_EMAIL',
      channel: 'EMAIL',
      subject: 'COALRR Login Verification Code',
      body: '<p>Your COALRR login OTP is <b>{{otpCode}}</b>. It is valid for 10 minutes. Please do not share this code.</p>',
      updt_ts: new Date()
    }
  })

  // 3. Register rules
  const smsRule = await db.notification_rule.findFirst({ where: { event_id: otpEvent.id, template_id: smsTemplate.id } })
  if (!smsRule) {
    await db.notification_rule.create({
      data: {
        id: randomUUID(),
        event_id: otpEvent.id,
        template_id: smsTemplate.id,
        recipient_resolver: 'EventUser',
        priority: "1", // Urgent priority
        updt_ts: new Date()
      }
    })
  }

  const emailRule = await db.notification_rule.findFirst({ where: { event_id: fallbackEvent.id, template_id: emailTemplate.id } })
  if (!emailRule) {
    await db.notification_rule.create({
      data: {
        id: randomUUID(),
        event_id: fallbackEvent.id,
        template_id: emailTemplate.id,
        recipient_resolver: 'EventUser',
        priority: "1", // Urgent priority
        updt_ts: new Date()
      }
    })
  }
}
