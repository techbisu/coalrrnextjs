import type { PrismaClient } from '@prisma/client'

export async function seedNotificationRule(db: PrismaClient) {
  console.log('🌱 Seeding notification_rule...')

  const masterEvent = await db.event_registry.findUnique({ where: { event_name: 'MASTER_DATA_UPDATED' } })
  const roleEvent = await db.event_registry.findUnique({ where: { event_name: 'USER_ROLE_ASSIGNED' } })
  const settingsEvent = await db.event_registry.findUnique({ where: { event_name: 'SETTINGS_CHANGED' } })

  const masterTpl = await db.notification_template.findUnique({ where: { code: 'TPL_MASTER_DATA_INAPP' } })
  const roleTpl = await db.notification_template.findUnique({ where: { code: 'TPL_ROLE_ASSIGNED_INAPP' } })
  const settingsTpl = await db.notification_template.findUnique({ where: { code: 'TPL_SETTINGS_CHANGED_INAPP' } })

  if (masterEvent && masterTpl) {
    const existing = await db.notification_rule.findFirst({ where: { event_id: masterEvent.id, template_id: masterTpl.id } })
    if (!existing) {
      await db.notification_rule.create({
        data: {
          event_id: masterEvent.id,
          template_id: masterTpl.id,
          recipient_resolver: 'Super Administrator',
          priority: "2"
        }
      })
    }
  }

  if (roleEvent && roleTpl) {
    const existing = await db.notification_rule.findFirst({ where: { event_id: roleEvent.id, template_id: roleTpl.id } })
    if (!existing) {
      await db.notification_rule.create({
        data: {
          event_id: roleEvent.id,
          template_id: roleTpl.id,
          recipient_resolver: 'EventUser',
          priority: "1"
        }
      })
    }
  }

  if (settingsEvent && settingsTpl) {
    const existing = await db.notification_rule.findFirst({ where: { event_id: settingsEvent.id, template_id: settingsTpl.id } })
    if (!existing) {
      await db.notification_rule.create({
        data: {
          event_id: settingsEvent.id,
          template_id: settingsTpl.id,
          recipient_resolver: 'Super Administrator',
          priority: "1"
        }
      })
    }
  }
}
