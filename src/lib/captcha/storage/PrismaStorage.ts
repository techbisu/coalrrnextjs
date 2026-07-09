import { db } from '@/lib/db'
import { CaptchaChallenge } from '@prisma/client'

export class PrismaStorage {
  async saveChallenge(data: Omit<CaptchaChallenge, 'id' | 'createdAt' | 'attempts'>): Promise<CaptchaChallenge> {
    return await db.captchaChallenge.create({
      data: {
        ...data,
        attempts: 0
      }
    })
  }

  async getChallenge(id: string): Promise<CaptchaChallenge | null> {
    return await db.captchaChallenge.findUnique({
      where: { id }
    })
  }

  async incrementAttempts(id: string): Promise<CaptchaChallenge> {
    return await db.captchaChallenge.update({
      where: { id },
      data: {
        attempts: { increment: 1 }
      }
    })
  }

  async deleteChallenge(id: string): Promise<void> {
    try {
      await db.captchaChallenge.delete({
        where: { id }
      })
    } catch (e) {
      // ignore if already deleted
    }
  }

  async expireOldChallenges(): Promise<void> {
    await db.captchaChallenge.deleteMany({
      where: {
        expiresAt: { lt: new Date() }
      }
    })
  }
}
