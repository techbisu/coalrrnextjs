import { PrismaCaptchaRepository } from '@/modules/captcha/infrastructure/repositories/PrismaCaptchaRepository';

export const expireCaptchasHandler = async (payload: any): Promise<void> => {
  const repository = new PrismaCaptchaRepository();
  await repository.expireOldChallenges();
};
