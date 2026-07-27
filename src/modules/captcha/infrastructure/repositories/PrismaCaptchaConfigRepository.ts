import { db } from '@/lib/db';
import { captcha_config } from '@prisma/client';
import { ICaptchaConfigRepository } from '../../domain/repositories/ICaptchaConfigRepository';

export class PrismaCaptchaConfigRepository implements ICaptchaConfigRepository {
  async getConfig(): Promise<captcha_config> {
    const config = await db.captcha_config.upsert({
      where: { id: 'global' },
      update: {},
      create: { id: 'global', difficulty: 'medium', updt_ts: new Date() },
    });
    return config;
  }
}
