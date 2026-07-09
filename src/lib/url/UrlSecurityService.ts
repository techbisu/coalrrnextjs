import crypto from 'crypto'
import { db } from '@/lib/db'

const ENCRYPTION_KEY = process.env.ENCRYPTION_SECRET || 'a_very_secure_32_byte_key_min_32!' // Must be 32 bytes
const IV_LENGTH = 16 // For AES, this is always 16

export class UrlSecurityService {
  /**
   * Encrypts a string (e.g. JSON payload) into an AES-256-GCM URL-safe Base64 token.
   */
  static encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY.substring(0, 32)), iv)
    let encrypted = cipher.update(text, 'utf8', 'base64')
    encrypted += cipher.final('base64')
    const authTag = cipher.getAuthTag().toString('base64')
    
    // Format: IV:AuthTag:EncryptedText
    const token = `${iv.toString('base64')}:${authTag}:${encrypted}`
    return Buffer.from(token).toString('base64url') // Make URL safe
  }

  /**
   * Decrypts an AES-256-GCM URL-safe Base64 token back to a string.
   */
  static decrypt(token: string): string {
    try {
      const raw = Buffer.from(token, 'base64url').toString('utf8')
      const [ivBase64, authTagBase64, encryptedText] = raw.split(':')
      
      const iv = Buffer.from(ivBase64, 'base64')
      const authTag = Buffer.from(authTagBase64, 'base64')
      const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY.substring(0, 32)), iv)
      decipher.setAuthTag(authTag)
      
      let decrypted = decipher.update(encryptedText, 'base64', 'utf8')
      decrypted += decipher.final('utf8')
      return decrypted
    } catch (e) {
      throw new Error('Invalid or tampered token')
    }
  }

  /**
   * Signs a URL for secure one-time or time-limited access.
   */
  static async signUrl(path: string, expiryMinutes: number, isOneTime = false, entityId?: string, action?: string): Promise<string> {
    const expiresAt = new Date(Date.now() + expiryMinutes * 60000)
    
    // Generate an HMAC over the path and expiry
    const dataToSign = `${path}|${expiresAt.toISOString()}`
    const signature = crypto.createHmac('sha256', ENCRYPTION_KEY).update(dataToSign).digest('base64url')

    // Store in DB for tracking/one-time use
    await db.signedUrlLog.create({
      data: {
        signatureHash: signature,
        urlPath: path,
        entityId,
        action,
        expiresAt,
        isOneTime
      }
    })

    const separator = path.includes('?') ? '&' : '?'
    return `${path}${separator}sig=${signature}&exp=${expiresAt.getTime()}`
  }

  /**
   * Verifies a signed URL, checking expiry and DB records for one-time consumption.
   */
  static async verifyUrl(pathWithoutQuery: string, searchParams: URLSearchParams): Promise<boolean> {
    const signature = searchParams.get('sig')
    const exp = searchParams.get('exp')
    
    if (!signature || !exp) return false

    const expiresAt = new Date(Number(exp))
    if (expiresAt < new Date()) return false // Expired

    // Verify HMAC
    const dataToSign = `${pathWithoutQuery}|${expiresAt.toISOString()}`
    const expectedSignature = crypto.createHmac('sha256', ENCRYPTION_KEY).update(dataToSign).digest('base64url')
    
    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature)) === false) {
      return false // Tampered
    }

    // Check database for consumption / revocation
    const log = await db.signedUrlLog.findUnique({ where: { signatureHash: signature } })
    if (!log) return false
    if (log.isConsumed) return false
    
    if (log.isOneTime) {
      await db.signedUrlLog.update({
        where: { id: log.id },
        data: { isConsumed: true, consumedAt: new Date() }
      })
    }

    return true
  }
}
