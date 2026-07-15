import type { PrismaClient } from '@prisma/client'

export async function seedNotificationTemplate(db: PrismaClient) {
  console.log('🌱 Seeding notification_template...')

  const templates = [
    {
      code: 'TPL_MASTER_DATA_INAPP',
      channel: 'IN_APP',
      subject: 'Master Data Updated: {{tableName}}',
      body: 'The master data table {{tableName}} was updated by {{userName}}.',
      is_active: true
    },
    {
      code: 'TPL_ROLE_ASSIGNED_INAPP',
      channel: 'IN_APP',
      subject: 'Role Assignment Changed',
      body: 'User {{targetUserName}} was assigned the role {{roleName}} by {{adminName}}.',
      is_active: true
    },
    {
      code: 'TPL_SETTINGS_CHANGED_INAPP',
      channel: 'IN_APP',
      subject: 'System Settings Changed',
      body: 'Critical enterprise settings were updated by {{userName}}.',
      is_active: true
    }
  ]

  for (const tpl of templates) {
    await db.notification_template.upsert({
      where: { code: tpl.code },
      update: {},
      create: tpl
    })
  }
}
