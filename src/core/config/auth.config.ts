import { env } from './env'

export const authConfig = {
  globalOtpEnabled: env.GLOBAL_OTP_ENABLED ?? true,
} as const;
