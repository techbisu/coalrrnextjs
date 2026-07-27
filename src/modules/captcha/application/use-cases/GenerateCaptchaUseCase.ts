import crypto from 'crypto';
import { ICaptchaRepository } from '../../domain/repositories/ICaptchaRepository';
import { ICaptchaConfigRepository } from '../../domain/repositories/ICaptchaConfigRepository';
import { ICaptchaAuditRepository } from '../../domain/repositories/ICaptchaAuditRepository';
import { ICaptchaProvider, MathProvider } from '@/lib/captcha/providers/MathProvider';
import { Container } from '@/infrastructure/di/Container';
import { Prisma } from '@prisma/client';

export class GenerateCaptchaUseCase {
  constructor(
    private captchaRepository: ICaptchaRepository,
    private configRepository: ICaptchaConfigRepository,
    private auditRepository: ICaptchaAuditRepository
  ) {}

  async execute(purpose: string, ip_address?: string, user_agent?: string) {
    const config = await this.configRepository.getConfig();
    
    // Choose provider dynamically based on configuration
    let provider: ICaptchaProvider;
    
    if (config.provider === 'svg-alphanumeric') {
      const { SvgProvider } = await import('@/lib/captcha/providers/SvgProvider');
      provider = new SvgProvider('alphanumeric');
    } else if (config.provider === 'svg-math') {
      const { SvgProvider } = await import('@/lib/captcha/providers/SvgProvider');
      provider = new SvgProvider('math');
    } else {
      // Default to plain text math provider
      provider = new MathProvider(); 
    }

    const { challenge, expected_answer } = provider.generate(config.difficulty);

    // Calculate expiration
    const expires_at = new Date();
    expires_at.setMinutes(expires_at.getMinutes() + config.expiration_minutes);

    const hashedAnswer = crypto.createHash('sha256').update(expected_answer).digest('hex');

    const payload: Prisma.captcha_challengeCreateInput = {
      id: crypto.randomUUID(),
      expected_answer: hashedAnswer,
      purpose,
      expires_at,
      ip_address: ip_address || null,
      user_agent: user_agent || null,
      updt_ts: new Date()
    };

    const saved = await this.captchaRepository.saveChallenge(payload);

    await this.auditRepository.logAudit('Generated', purpose, ip_address);

    // Dispatch background job for cleanup
    await Container.jobDispatcher.dispatch('expireCaptchas', {});

    return {
      id: saved.id,
      challenge,
      expires_at
    };
  }
}
