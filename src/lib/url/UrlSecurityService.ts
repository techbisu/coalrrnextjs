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
   * Encrypts a URL parameter (e.g. project code like "ECL/4501/4501/2026/0001") into an AES-256-GCM URL-safe Base64 token.
   */
  static encryptUrlParam(param: string): string {
    if (!param) return ''
    return this.encrypt(param)
  }

  /**
   * Safely decrypts a URL parameter (token or array of path segments from catch-all routes).
   * Falls back to joining path segments or raw string if parameter is not encrypted or decryption fails.
   */
  static safeDecryptUrlParam(param: string | string[]): string {
    if (!param) return ''
    const rawString = Array.isArray(param) ? param.join('/') : param
    if (!rawString) return ''

    try {
      const decrypted = this.decrypt(rawString)
      return decrypted || rawString
    } catch {
      return rawString
    }
  }

  /**
   * Signs a URL for secure one-time or time-limited access.
   */
  static async signUrl(path: string, expiryMinutes: number, is_one_time = false, entity_id?: string, action?: string): Promise<string> {
    const expires_at = new Date(Date.now() + expiryMinutes * 60000)
    
    // Generate an HMAC over the path and expiry
    const dataToSign = `${path}|${expires_at.toISOString()}`
    const signature = crypto.createHmac('sha256', ENCRYPTION_KEY).update(dataToSign).digest('base64url')

    // Store in DB for tracking/one-time use
    await db.signed_url_log.create({
      data: {
        signature_hash: signature,
        url_path: path,
        entity_id,
        action,
        expires_at,
        is_one_time
      }
    })

    const separator = path.includes('?') ? '&' : '?'
    return `${path}${separator}sig=${signature}&exp=${expires_at.getTime()}`
  }

  /**
   * Verifies a signed URL, checking expiry and DB records for one-time consumption.
   */
  static async verifyUrl(pathWithoutQuery: string, searchParams: URLSearchParams): Promise<boolean> {
    const signature = searchParams.get('sig')
    const exp = searchParams.get('exp')
    
    if (!signature || !exp) return false

    const expires_at = new Date(Number(exp))
    if (expires_at < new Date()) return false // Expired

    // Verify HMAC
    const dataToSign = `${pathWithoutQuery}|${expires_at.toISOString()}`
    const expectedSignature = crypto.createHmac('sha256', ENCRYPTION_KEY).update(dataToSign).digest('base64url')
    
    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature)) === false) {
      return false // Tampered
    }

    // Check database for consumption / revocation
    const log = await db.signed_url_log.findUnique({ where: { signature_hash: signature } })
    if (!log) return false
    if (log.is_consumed) return false
    
    if (log.is_one_time) {
      await db.signed_url_log.update({
        where: { id: log.id },
        data: { is_consumed: true, consumed_at: new Date() }
      })
    }

    return true
  }
}
