import { db } from '@/lib/db';
import crypto from 'crypto';
import { ICaptchaAuditRepository } from '../../domain/repositories/ICaptchaAuditRepository';

export class PrismaCaptchaAuditRepository implements ICaptchaAuditRepository {
  async logAudit(action: string, purpose: string, ip_address?: string): Promise<void> {
    try {
      await db.captcha_audit_log.create({
        data: {
          id: crypto.randomUUID(),
          action,
          purpose,
          ip_address: ip_address || 'unknown',
          updt_ts: new Date()
        }
      });
    } catch (e) {
      console.error('Failed to write CAPTCHA audit log', e);
    }
  }
}
