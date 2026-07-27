import crypto from 'crypto';
import { ICaptchaRepository } from '../../domain/repositories/ICaptchaRepository';
import { ICaptchaConfigRepository } from '../../domain/repositories/ICaptchaConfigRepository';
import { ICaptchaAuditRepository } from '../../domain/repositories/ICaptchaAuditRepository';

export class ValidateCaptchaUseCase {
  constructor(
    private captchaRepository: ICaptchaRepository,
    private configRepository: ICaptchaConfigRepository,
    private auditRepository: ICaptchaAuditRepository
  ) {}

  async execute(id: string, answer: string, ip_address?: string): Promise<{ valid: boolean; reason?: string }> {
    const config = await this.configRepository.getConfig();
    const challenge = await this.captchaRepository.getChallenge(id);

    if (!challenge) {
      return { valid: false, reason: 'Invalid or missing CAPTCHA ID' };
    }

    if (new Date() > challenge.expires_at) {
      await this.captchaRepository.deleteChallenge(id);
      await this.auditRepository.logAudit('Expired', challenge.purpose, ip_address);
      return { valid: false, reason: 'CAPTCHA expired' };
    }

    if (challenge.attempts >= config.max_attempts) {
      await this.captchaRepository.deleteChallenge(id);
      return { valid: false, reason: 'Too many failed attempts. Please request a new CAPTCHA.' };
    }

    const hashedIncoming = crypto.createHash('sha256').update(answer.trim()).digest('hex');

    if (hashedIncoming === challenge.expected_answer) {
      await this.captchaRepository.deleteChallenge(id);
      await this.auditRepository.logAudit('Validated', challenge.purpose, ip_address);
      return { valid: true };
    } else {
      await this.captchaRepository.incrementAttempts(id);
      await this.auditRepository.logAudit('Failed', challenge.purpose, ip_address);
      return { valid: false, reason: 'Incorrect answer' };
    }
  }
}
