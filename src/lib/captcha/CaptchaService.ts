import { db } from '@/lib/db'
import { MathProvider } from './providers/MathProvider'
import { PrismaStorage } from './storage/PrismaStorage'
import crypto from 'crypto'

export class CaptchaService {
  private static storage = new PrismaStorage()

  /**
   * Retrieves or initializes the global CAPTCHA configuration.
   */
  static async getConfig() {
    const config = await db.captchaConfig.upsert({
      where: { id: 'global' },
      update: {},
      create: { id: 'global', difficulty: 'difficult' },
    })
    return config
  }

  /**
   * Generates a new CAPTCHA challenge based on current configuration.
   */
  static async generate(purpose: string, ipAddress?: string, userAgent?: string) {
    const config = await this.getConfig()
    
    // Choose provider (only math implemented currently)
    let provider
    if (config.provider === 'math') {
      provider = new MathProvider()
    } else {
      provider = new MathProvider() // Fallback
    }

    const { challenge, expectedAnswer } = provider.generate(config.difficulty)

    // Calculate expiration
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + config.expirationMinutes)

    // We can hash the answer before storing if desired. 
    // Since it's mathematical and single-use, storing plain string temporarily is generally safe, 
    // but hashing satisfies strict enterprise rules.
    const hashedAnswer = crypto.createHash('sha256').update(expectedAnswer).digest('hex')

    // Store in DB
    const saved = await this.storage.saveChallenge({
      expectedAnswer: hashedAnswer,
      purpose,
      expiresAt,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null
    })

    // Log Audit
    await this.logAudit('Generated', purpose, ipAddress)

    // Trigger async cleanup
    this.storage.expireOldChallenges().catch(console.error)

    return {
      id: saved.id,
      challenge,
      expiresAt
    }
  }

  /**
   * Validates a submitted answer against a given CAPTCHA ID.
   */
  static async validate(id: string, answer: string, ipAddress?: string): Promise<{ valid: boolean; reason?: string }> {
    const config = await this.getConfig()
    const challenge = await this.storage.getChallenge(id)

    if (!challenge) {
      return { valid: false, reason: 'Invalid or missing CAPTCHA ID' }
    }

    // Check expiration
    if (new Date() > challenge.expiresAt) {
      await this.storage.deleteChallenge(id)
      await this.logAudit('Expired', challenge.purpose, ipAddress)
      return { valid: false, reason: 'CAPTCHA expired' }
    }

    // Check attempts
    if (challenge.attempts >= config.maxAttempts) {
      await this.storage.deleteChallenge(id)
      return { valid: false, reason: 'Too many failed attempts. Please request a new CAPTCHA.' }
    }

    // Hash the incoming answer to compare
    const hashedIncoming = crypto.createHash('sha256').update(answer.trim()).digest('hex')

    if (hashedIncoming === challenge.expectedAnswer) {
      // Success - delete it (one time use)
      await this.storage.deleteChallenge(id)
      await this.logAudit('Validated', challenge.purpose, ipAddress)
      return { valid: true }
    } else {
      // Failed - increment attempts
      await this.storage.incrementAttempts(id)
      await this.logAudit('Failed', challenge.purpose, ipAddress)
      return { valid: false, reason: 'Incorrect answer' }
    }
  }

  /**
   * Refreshes a CAPTCHA by deleting the old one and generating a new one.
   */
  static async refresh(oldId: string, purpose: string, ipAddress?: string, userAgent?: string) {
    await this.storage.deleteChallenge(oldId)
    await this.logAudit('Refreshed', purpose, ipAddress)
    return await this.generate(purpose, ipAddress, userAgent)
  }

  private static async logAudit(action: string, purpose: string, ipAddress?: string) {
    try {
      await db.captchaAuditLog.create({
        data: {
          action,
          purpose,
          ipAddress: ipAddress || 'unknown',
        }
      })
    } catch (e) {
      console.error('Failed to write CAPTCHA audit log', e)
    }
  }
}
