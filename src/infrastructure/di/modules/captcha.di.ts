import { PrismaCaptchaRepository } from '@/modules/captcha/infrastructure/repositories/PrismaCaptchaRepository';
import { PrismaCaptchaConfigRepository } from '@/modules/captcha/infrastructure/repositories/PrismaCaptchaConfigRepository';
import { PrismaCaptchaAuditRepository } from '@/modules/captcha/infrastructure/repositories/PrismaCaptchaAuditRepository';
import { GenerateCaptchaUseCase } from '@/modules/captcha/application/use-cases/GenerateCaptchaUseCase';
import { ValidateCaptchaUseCase } from '@/modules/captcha/application/use-cases/ValidateCaptchaUseCase';
import { RefreshCaptchaUseCase } from '@/modules/captcha/application/use-cases/RefreshCaptchaUseCase';

const globalForCaptchaDI = globalThis as unknown as {
  captchaRepository: PrismaCaptchaRepository | undefined
  captchaConfigRepository: PrismaCaptchaConfigRepository | undefined
  captchaAuditRepository: PrismaCaptchaAuditRepository | undefined
  generateCaptchaUseCase: GenerateCaptchaUseCase | undefined
  validateCaptchaUseCase: ValidateCaptchaUseCase | undefined
  refreshCaptchaUseCase: RefreshCaptchaUseCase | undefined
}

export const captchaRepository = globalForCaptchaDI.captchaRepository ?? new PrismaCaptchaRepository()
export const captchaConfigRepository = globalForCaptchaDI.captchaConfigRepository ?? new PrismaCaptchaConfigRepository()
export const captchaAuditRepository = globalForCaptchaDI.captchaAuditRepository ?? new PrismaCaptchaAuditRepository()

export const generateCaptchaUseCase = globalForCaptchaDI.generateCaptchaUseCase ?? new GenerateCaptchaUseCase(
  captchaRepository,
  captchaConfigRepository,
  captchaAuditRepository
)

export const validateCaptchaUseCase = globalForCaptchaDI.validateCaptchaUseCase ?? new ValidateCaptchaUseCase(
  captchaRepository,
  captchaConfigRepository,
  captchaAuditRepository
)

export const refreshCaptchaUseCase = globalForCaptchaDI.refreshCaptchaUseCase ?? new RefreshCaptchaUseCase(
  captchaRepository,
  captchaAuditRepository,
  generateCaptchaUseCase
)

if (process.env.NODE_ENV !== 'production') {
  globalForCaptchaDI.captchaRepository = captchaRepository
  globalForCaptchaDI.captchaConfigRepository = captchaConfigRepository
  globalForCaptchaDI.captchaAuditRepository = captchaAuditRepository
  globalForCaptchaDI.generateCaptchaUseCase = generateCaptchaUseCase
  globalForCaptchaDI.validateCaptchaUseCase = validateCaptchaUseCase
  globalForCaptchaDI.refreshCaptchaUseCase = refreshCaptchaUseCase
}
