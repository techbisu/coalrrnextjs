import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'
const db = new PrismaClient()

export async function seedFileNotification(db: PrismaClient) {
  console.log('Seeding FILE_UPLOADED & FILE_ASSIGNED notification rules...')

  // 1. Register FILE_UPLOADED Event
  const fileUploadedEvent = await db.event_registry.upsert({
    where: { event_name: 'FILE_UPLOADED' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      event_name: 'FILE_UPLOADED',
      module: 'file-management',
      description: 'Triggered when a file is uploaded',
      updt_ts: new Date()
    }
  })

  // Register FILE_ASSIGNED Event
  const fileAssignedEvent = await db.event_registry.upsert({
    where: { event_name: 'FILE_ASSIGNED' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      event_name: 'FILE_ASSIGNED',
      module: 'file-management',
      description: 'Triggered when a file is attached to an entity',
      updt_ts: new Date()
    }
  })

  // 2. Create IN_APP Templates
  const uploadedTemplate = await db.notification_template.upsert({
    where: { code: 'TPL_FILE_UPLOADED_INAPP' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      code: 'TPL_FILE_UPLOADED_INAPP',
      channel: 'IN_APP',
      subject: 'File Uploaded: {{fileName}}',
      body: 'A new file {{fileName}} was uploaded to the workspace.',
      updt_ts: new Date()
    }
  })

  const assignedTemplate = await db.notification_template.upsert({
    where: { code: 'TPL_FILE_ASSIGNED_INAPP' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      code: 'TPL_FILE_ASSIGNED_INAPP',
      channel: 'IN_APP',
      subject: 'File Linked: {{fileName}}',
      body: 'File {{fileName}} was attached to a {{entityType}}.',
      updt_ts: new Date()
    }
  })

  // 3. Create Rules for FILE_UPLOADED
  const existingUploadedRule = await db.notification_rule.findFirst({
    where: { event_id: fileUploadedEvent.id, template_id: uploadedTemplate.id, recipient_resolver: 'Role:Super Administrator' }
  })
  if (!existingUploadedRule) {
    await db.notification_rule.create({
      data: {
        id: crypto.randomUUID(),
        event_id: fileUploadedEvent.id,
        template_id: uploadedTemplate.id,
        recipient_resolver: 'Role:Super Administrator',
        is_active: true,
        updt_ts: new Date()
      }
    })
  }

  // 3. Create Rules for FILE_ASSIGNED
  const existingAssignedRule = await db.notification_rule.findFirst({
    where: { event_id: fileAssignedEvent.id, template_id: assignedTemplate.id, recipient_resolver: 'Role:Super Administrator' }
  })
  if (!existingAssignedRule) {
    await db.notification_rule.create({
      data: {
        id: crypto.randomUUID(),
        event_id: fileAssignedEvent.id,
        template_id: assignedTemplate.id,
        recipient_resolver: 'Role:Super Administrator',
        is_active: true,
        updt_ts: new Date()
      }
    })
  }
  
  const existingAssignedUnitRule = await db.notification_rule.findFirst({
    where: { event_id: fileAssignedEvent.id, template_id: assignedTemplate.id, recipient_resolver: 'Role:Unit Officer' }
  })
  if (!existingAssignedUnitRule) {
    await db.notification_rule.create({
      data: {
        id: crypto.randomUUID(),
        event_id: fileAssignedEvent.id,
        template_id: assignedTemplate.id,
        recipient_resolver: 'Role:Unit Officer',
        is_active: true,
        updt_ts: new Date()
      }
    })
  }

  console.log('File Notification rules seeded successfully!')
}

if (require.main === module) {
  seedFileNotification(db)
    .catch(e => {
      console.error(e)
      process.exit(1)
    })
    .finally(async () => {
      await db.$disconnect()
    })
}
