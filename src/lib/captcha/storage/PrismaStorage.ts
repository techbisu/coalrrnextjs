import { db } from '@/lib/db'
import { PrismaClient, captcha_challenge, Prisma } from '@prisma/client'

import { randomUUID } from 'crypto'

export class PrismaStorage {
  async saveChallenge(data: Prisma.captcha_challengeCreateInput): Promise<captcha_challenge> {
    return await db.captcha_challenge.create({
      data: {
        id: randomUUID(),
        ...data,
        attempts: 0,
        updt_ts: new Date()
      }
    })
  }

  async getChallenge(id: string): Promise<captcha_challenge | null> {
    return await db.captcha_challenge.findUnique({
      where: { id }
    })
  }

  async incrementAttempts(id: string): Promise<captcha_challenge> {
    return await db.captcha_challenge.update({
      where: { id },
      data: {
        attempts: { increment: 1 }
      }
    })
  }

  async deleteChallenge(id: string): Promise<void> {
    try {
      await db.captcha_challenge.delete({
        where: { id }
      })
    } catch (e) {
      // ignore if already deleted
    }
  }

  async expireOldChallenges(): Promise<void> {
    await db.captcha_challenge.deleteMany({
      where: {
        expires_at: { lt: new Date() }
      }
    })
  }
}
