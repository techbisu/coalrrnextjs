import type { PrismaClient } from '@prisma/client'

export async function seedEventRegistry(db: PrismaClient) {
  console.log('🌱 Seeding event_registry...')

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
}
