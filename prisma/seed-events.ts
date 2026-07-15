import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function seedEvents() {
  console.log('🌱 Seeding Enterprise Events & Notifications...')

  // 1. Register Core Events
  const events = [
    { event_name: 'MASTER_DATA_UPDATED', module: 'admin', description: 'Triggered when Master Data records are updated' },
    { event_name: 'USER_ROLE_ASSIGNED', module: 'iam', description: 'Triggered when a User is assigned a new Role' },
    { event_name: 'SETTINGS_CHANGED', module: 'admin', description: 'Triggered when Enterprise Settings are modified' },
    { event_name: 'PROPOSAL_APPROVED', module: 'land-acquisition', description: 'Triggered when a Land Schedule is approved' },
  ]

  for (const evt of events) {
    await db.event_registry.upsert({
      where: { event_name: evt.event_name },
      update: {},
      create: evt
    })
  }
  console.log('✅ Registered Core Events')

  // 2. Create Templates
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
  console.log('✅ Registered Notification Templates')

  // 3. Create Rules
  // Fetch event IDs
  const masterEvent = await db.event_registry.findUnique({ where: { event_name: 'MASTER_DATA_UPDATED' } })
  const roleEvent = await db.event_registry.findUnique({ where: { event_name: 'USER_ROLE_ASSIGNED' } })
  const settingsEvent = await db.event_registry.findUnique({ where: { event_name: 'SETTINGS_CHANGED' } })

  // Fetch template IDs
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
          recipient_resolver: 'Super Administrator', // Assuming role based lookup exists
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
          recipient_resolver: 'EventUser', // Target the user directly
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
  
  console.log('✅ Registered Notification Rules')
}

if (require.main === module || process.argv[1].includes('seed-events')) {
  seedEvents().catch(e => {
    console.error(e)
    process.exit(1)
  }).finally(async () => {
    await db.$disconnect()
  })
}
