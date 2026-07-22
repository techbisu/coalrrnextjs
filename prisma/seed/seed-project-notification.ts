import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'
const db = new PrismaClient()

async function main() {
  console.log('Seeding PROJECT_CREATED notification rule...')

  // 1. Register Event
  const event = await db.event_registry.upsert({
    where: { event_name: 'PROJECT_CREATED' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      event_name: 'PROJECT_CREATED',
      module: 'project-master',
      description: 'Triggered when a new project baseline is drafted',
      updt_ts: new Date()
    }
  })

  // 2. Create IN_APP Template
  const template = await db.notification_template.upsert({
    where: { code: 'TPL_PROJECT_CREATED_INAPP' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      code: 'TPL_PROJECT_CREATED_INAPP',
      channel: 'IN_APP',
      subject: 'New Project: {{name}}',
      body: 'A new project {{name}} (Colliery: {{mine_cd}}) has been created.',
      updt_ts: new Date()
    }
  })

  // 3. Create Rule (Targeting Super Administrator, GM, or Area Officer)
  // We'll target Role:Super Administrator for demo purposes since we just assigned that to everyone.
  const existingRule = await db.notification_rule.findFirst({
    where: { event_id: event.id, template_id: template.id }
  })
  if (!existingRule) {
    await db.notification_rule.create({
      data: {
        id: crypto.randomUUID(),
        event_id: event.id,
        template_id: template.id,
        recipient_resolver: 'Role:Super Administrator',
        is_active: true,
        updt_ts: new Date()
      }
    })
  }

  console.log('Notification rule seeded successfully!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
