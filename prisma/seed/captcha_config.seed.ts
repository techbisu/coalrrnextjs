import type { PrismaClient } from '@prisma/client'

export async function seedCaptchaConfig(db: PrismaClient) {
  console.log('🌱 Seeding captcha_config...')

  const config = {
    id: 'global',
    provider: 'math',
    difficulty: 'medium',
    expiration_minutes: 10,
    max_attempts: 3,
    adaptive_captcha: true,
    show_after_failed_login: 3,
    updt_ts: new Date(),
    entry_ts: new Date(),
    entry_by: 'system',
  }

  await db.captcha_config.upsert({
    where: { id: config.id },
    update: {
      provider: config.provider,
      difficulty: config.difficulty,
      expiration_minutes: config.expiration_minutes,
      max_attempts: config.max_attempts,
      adaptive_captcha: config.adaptive_captcha,
      show_after_failed_login: config.show_after_failed_login,
      updt_ts: new Date(),
    },
    create: config,
  })
}
