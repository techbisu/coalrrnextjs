// src/core/config/otp.config.ts

export const otpConfig = {
  /** Time in minutes before an OTP expires */
  expiryMinutes: Number(process.env.OTP_EXPIRY_MINUTES ?? 10),
  
  /** Max failed verification attempts before session is locked out */
  maxVerificationAttempts: Number(process.env.OTP_MAX_VERIFY_ATTEMPTS ?? 5),
  
  /** Max times a user can hit "Resend" before we lock out or change behavior */
  maxResendAttempts: Number(process.env.OTP_MAX_RESEND_ATTEMPTS ?? 5),
  
  /** Number of resends before we fallback to the secondary channel (e.g. Email) */
  fallbackAfterResends: Number(process.env.OTP_FALLBACK_RESENDS ?? 2),
  
  /** Length of the generated OTP */
  length: Number(process.env.OTP_LENGTH ?? 6),
} as const;
