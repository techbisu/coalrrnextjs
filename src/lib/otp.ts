import { db } from '@/lib/db'
import { createHash, randomInt } from 'crypto'
import { EventBus } from '@/core/notifications/EventBus'
import { otpConfig } from '@/core/config/otp.config'
import { Audit } from '@/core/audit/services/AuditService'

export interface OtpRequestInfo {
  ipAddress?: string
  userAgent?: string
}

export async function generateAndSendOTP(
  userId: number | null, 
  module: string = 'auth', 
  contactValue?: string, 
  purpose: string = 'AUTH_LOGIN',
  reqInfo?: OtpRequestInfo
) {
  // 1. Generate a secure random OTP based on configured length
  const min = Math.pow(10, otpConfig.length - 1)
  const max = Math.pow(10, otpConfig.length) - 1
  const otp = randomInt(min, max).toString()
  const otp_hash = createHash('sha256').update(otp).digest('hex')

  // 2. Set expiry
  const expires_at = new Date(Date.now() + otpConfig.expiryMinutes * 60 * 1000)

  // 3. Save to database
  const session = await db.otp_session.create({
    data: {
      user: userId ? { connect: { id: userId } } : undefined,
      contact_value: contactValue,
      purpose,
      otp_hash,
      expires_at
    }
  })

  // 4. Trigger EventBus (This will queue the BullMQ job for SMS or Email)
  await EventBus.publish({
    event_name: purpose === 'AUTH_LOGIN' ? 'USER_LOGIN_OTP' : 'GENERIC_OTP_REQUESTED',
    module,
    user_id: userId ? userId.toString() : 'system',
    data: {
      otpCode: otp,
      contactValue,
      purpose
    }
  })

  // 5. Log Security Event
  await Audit.logCustomAction({
    activity: `OTP Requested for ${purpose}`,
    userId: userId ? userId.toString() : 'system',
    ipAddress: reqInfo?.ipAddress,
    userAgent: reqInfo?.userAgent
  });

  // For development demo purposes, log it so the user can test easily 
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEV ONLY] GENERATED OTP FOR USER ${userId}: ${otp}`)
    return { sessionId: session.id, devOtp: otp }
  }

  return { sessionId: session.id }
}

export async function resendOTP(sessionId: string, reqInfo?: OtpRequestInfo): Promise<{ success: boolean, message?: string, error?: string, devOtp?: string }> {
  const session = await db.otp_session.findUnique({
    where: { id: sessionId }
  });

  if (!session) return { success: false, error: 'Session not found' };
  if (session.is_used) return { success: false, error: 'OTP already used' };
  if (session.attempts >= otpConfig.maxVerificationAttempts) return { success: false, error: 'Too many failed verification attempts' };
  if (session.send_attempts >= otpConfig.maxResendAttempts) return { success: false, error: 'Too many resend attempts. Please start over.' };

  // Update send_attempts and reset expiry
  const updatedSession = await db.otp_session.update({
    where: { id: sessionId },
    data: { 
      send_attempts: { increment: 1 },
      expires_at: new Date(Date.now() + otpConfig.expiryMinutes * 60 * 1000) 
    }
  });

  // If send attempts >= fallback limit, fallback to EMAIL
  const isFallbackToEmail = updatedSession.send_attempts >= otpConfig.fallbackAfterResends;
  let eventName = session.purpose === 'AUTH_LOGIN' ? 'USER_LOGIN_OTP' : 'GENERIC_OTP_REQUESTED';
  if (isFallbackToEmail) {
    eventName = session.purpose === 'AUTH_LOGIN' ? 'USER_LOGIN_OTP_EMAIL_FALLBACK' : 'GENERIC_OTP_EMAIL_FALLBACK';
  }

  // Generate NEW OTP
  const min = Math.pow(10, otpConfig.length - 1);
  const max = Math.pow(10, otpConfig.length) - 1;
  const newOtp = randomInt(min, max).toString();
  const newOtpHash = createHash('sha256').update(newOtp).digest('hex');

  await db.otp_session.update({
    where: { id: sessionId },
    data: { otp_hash: newOtpHash }
  });

  await EventBus.publish({
    event_name: eventName,
    module: 'auth',
    user_id: session.user_id ? session.user_id.toString() : 'system',
    data: { 
      otpCode: newOtp,
      contactValue: session.contact_value,
      purpose: session.purpose
    }
  });

  await Audit.logCustomAction({
    activity: isFallbackToEmail ? `OTP Fallback Triggered for ${session.purpose}` : `OTP Resent for ${session.purpose}`,
    userId: session.user_id ? session.user_id.toString() : 'system',
    ipAddress: reqInfo?.ipAddress,
    userAgent: reqInfo?.userAgent
  });

  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEV ONLY] RESENT OTP (Fallback=${isFallbackToEmail}) FOR USER ${session.user_id}: ${newOtp}`);
    return { success: true, message: isFallbackToEmail ? 'OTP sent via Email' : 'OTP resent via SMS', devOtp: newOtp };
  }

  return { success: true, message: isFallbackToEmail ? 'OTP sent via Email' : 'OTP resent via SMS' };
}

export async function verifyOTP(sessionId: string, otp: string, reqInfo?: OtpRequestInfo): Promise<{ success: boolean, session?: any, error?: string }> {
  const session = await db.otp_session.findUnique({
    where: { id: sessionId }
  })

  if (!session) {
    return { success: false, error: 'Invalid OTP session' }
  }

  if (session.is_used) {
    return { success: false, error: 'OTP already used' }
  }

  if (session.expires_at < new Date()) {
    return { success: false, error: 'OTP has expired' }
  }

  if (session.attempts >= otpConfig.maxVerificationAttempts) {
    await Audit.logCustomAction({
      activity: `OTP Verification Locked Out for ${session.purpose}`,
      userId: session.user_id ? session.user_id.toString() : 'system',
      ipAddress: reqInfo?.ipAddress,
      userAgent: reqInfo?.userAgent
    });
    return { success: false, error: 'Too many failed attempts. Please request a new OTP.' }
  }

  const otp_hash = createHash('sha256').update(otp).digest('hex')

  if (session.otp_hash !== otp_hash) {
    await db.otp_session.update({
      where: { id: sessionId },
      data: { attempts: { increment: 1 } }
    })
    await Audit.logCustomAction({
      activity: `OTP Verification Failed for ${session.purpose} (Attempt ${session.attempts + 1})`,
      userId: session.user_id ? session.user_id.toString() : 'system',
      ipAddress: reqInfo?.ipAddress,
      userAgent: reqInfo?.userAgent
    });
    return { success: false, error: 'Invalid OTP code' }
  }

  // Mark as used
  await db.otp_session.update({
    where: { id: sessionId },
    data: { is_used: true }
  })

  await Audit.logCustomAction({
    activity: `OTP Verification Succeeded for ${session.purpose}`,
    userId: session.user_id ? session.user_id.toString() : 'system',
    ipAddress: reqInfo?.ipAddress,
    userAgent: reqInfo?.userAgent
  });

  return { success: true, session }
}
