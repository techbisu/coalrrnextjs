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
    const config = await db.captcha_config.upsert({
      where: { id: 'global' },
      update: {},
      create: { id: 'global', difficulty: 'medium' },
    })
    return config
  }

  /**
   * Generates a new CAPTCHA challenge based on current configuration.
   */
  static async generate(purpose: string, ip_address?: string, user_agent?: string) {
    const config = await this.getConfig()
    
    // Choose provider (only math implemented currently)
    let provider
    if (config.provider === 'math') {
      provider = new MathProvider()
    } else {
      provider = new MathProvider() // Fallback
    }

    const { challenge, expected_answer } = provider.generate(config.difficulty)

    // Calculate expiration
    const expires_at = new Date()
    expires_at.setMinutes(expires_at.getMinutes() + config.expiration_minutes)

    // We can hash the answer before storing if desired. 
    // Since it's mathematical and single-use, storing plain string temporarily is generally safe, 
    // but hashing satisfies strict enterprise rules.
    const hashedAnswer = crypto.createHash('sha256').update(expected_answer).digest('hex')

    // Store in DB
    const saved = await this.storage.saveChallenge({
      expected_answer: hashedAnswer,
      purpose,
      expires_at,
      ip_address: ip_address || null,
      user_agent: user_agent || null
    })

    // Log Audit
    await this.logAudit('Generated', purpose, ip_address)

    // Trigger async cleanup
    this.storage.expireOldChallenges().catch(console.error)

    return {
      id: saved.id,
      challenge,
      expires_at
    }
  }

  /**
   * Validates a submitted answer against a given CAPTCHA ID.
   */
  static async validate(id: string, answer: string, ip_address?: string): Promise<{ valid: boolean; reason?: string }> {
    const config = await this.getConfig()
    const challenge = await this.storage.getChallenge(id)

    if (!challenge) {
      return { valid: false, reason: 'Invalid or missing CAPTCHA ID' }
    }

    // Check expiration
    if (new Date() > challenge.expires_at) {
      await this.storage.deleteChallenge(id)
      await this.logAudit('Expired', challenge.purpose, ip_address)
      return { valid: false, reason: 'CAPTCHA expired' }
    }

    // Check attempts
    if (challenge.attempts >= config.max_attempts) {
      await this.storage.deleteChallenge(id)
      return { valid: false, reason: 'Too many failed attempts. Please request a new CAPTCHA.' }
    }

    // Hash the incoming answer to compare
    const hashedIncoming = crypto.createHash('sha256').update(answer.trim()).digest('hex')

    if (hashedIncoming === challenge.expected_answer) {
      // Success - delete it (one time use)
      await this.storage.deleteChallenge(id)
      await this.logAudit('Validated', challenge.purpose, ip_address)
      return { valid: true }
    } else {
      // Failed - increment attempts
      await this.storage.incrementAttempts(id)
      await this.logAudit('Failed', challenge.purpose, ip_address)
      return { valid: false, reason: 'Incorrect answer' }
    }
  }

  /**
   * Refreshes a CAPTCHA by deleting the old one and generating a new one.
   */
  static async refresh(oldId: string, purpose: string, ip_address?: string, user_agent?: string) {
    await this.storage.deleteChallenge(oldId)
    await this.logAudit('Refreshed', purpose, ip_address)
    return await this.generate(purpose, ip_address, user_agent)
  }

  private static async logAudit(action: string, purpose: string, ip_address?: string) {
    try {
      await db.captcha_audit_log.create({
        data: {
          action,
          purpose,
          ip_address: ip_address || 'unknown',
        }
      })
    } catch (e) {
      console.error('Failed to write CAPTCHA audit log', e)
    }
  }
}
