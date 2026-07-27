import { ICaptchaRepository } from '../../domain/repositories/ICaptchaRepository';
import { ICaptchaAuditRepository } from '../../domain/repositories/ICaptchaAuditRepository';
import { GenerateCaptchaUseCase } from './GenerateCaptchaUseCase';

export class RefreshCaptchaUseCase {
  constructor(
    private captchaRepository: ICaptchaRepository,
    private auditRepository: ICaptchaAuditRepository,
    private generateUseCase: GenerateCaptchaUseCase
  ) {}

  async execute(oldId: string, purpose: string, ip_address?: string, user_agent?: string) {
    await this.captchaRepository.deleteChallenge(oldId);
    await this.auditRepository.logAudit('Refreshed', purpose, ip_address);
    return await this.generateUseCase.execute(purpose, ip_address, user_agent);
  }
}
