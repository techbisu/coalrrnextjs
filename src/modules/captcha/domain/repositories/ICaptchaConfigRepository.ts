import { captcha_config } from '@prisma/client';

export interface ICaptchaConfigRepository {
  getConfig(): Promise<captcha_config>;
}
