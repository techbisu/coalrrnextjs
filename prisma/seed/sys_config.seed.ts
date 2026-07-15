import type { PrismaClient } from '@prisma/client'

export async function seedSysConfig(db: PrismaClient) {
  console.log('Seeding sys_config...')

  const configs = [
    {
      category: 'AUTHENTICATION',
      key: 'MAX_LOGIN_ATTEMPTS',
      value: '5',
      type: 'NUMBER',
      description: 'Maximum failed login attempts before locking out user',
      is_secret: false,
    },
    {
      category: 'AUTHENTICATION',
      key: 'SESSION_TIMEOUT_MINUTES',
      value: '30',
      type: 'NUMBER',
      description: 'Idle session timeout in minutes',
      is_secret: false,
    },
    {
      category: 'NOTIFICATIONS',
      key: 'DEFAULT_SENDER_EMAIL',
      value: 'no-reply@coalrr.gov.in',
      type: 'STRING',
      description: 'Default sender address for system emails',
      is_secret: false,
    },
    {
      category: 'SYSTEM',
      key: 'MAINTENANCE_MODE',
      value: 'false',
      type: 'BOOLEAN',
      description: 'Enable maintenance mode (blocks all non-admin logins)',
      is_secret: false,
    }
  ]

  for (const config of configs) {
    await db.sys_config.upsert({
      where: { key: config.key },
      update: {
        category: config.category,
        value: config.value,
        type: config.type,
        description: config.description,
        is_secret: config.is_secret,
      },
      create: config,
    })
  }
}
