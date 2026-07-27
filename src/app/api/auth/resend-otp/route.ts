import { ok, badRequest, serverError, readJson } from '../../_lib'
import type { NextRequest } from 'next/server'
import { resendOTP } from '@/lib/otp'

export async function POST(req: NextRequest) {
  try {
    const body = await readJson<{ sessionId?: string }>(req)

    if (!body?.sessionId) {
      return badRequest('sessionId is required')
    }

    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;
    const userAgent = req.headers.get('user-agent') || undefined;
    const result = await resendOTP(body.sessionId, { ipAddress, userAgent })

    if (!result.success) {
      return badRequest(result.error || 'Failed to resend OTP')
    }

    return ok({ message: result.message, devOtp: result.devOtp })

  } catch (e) {
    return serverError('OTP Resend failed', e instanceof Error ? e.message : String(e))
  }
}
