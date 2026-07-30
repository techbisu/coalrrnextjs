// POST /api/auth/login — Login for ECL (email+password) and citizens (mobile+OTP)
import { db } from '@/lib/db'
import { createSession } from '@/lib/auth'
import { ok, badRequest, serverError, readJson } from '../../_lib'
import bcrypt from 'bcrypt'
import type { NextRequest } from 'next/server'
import { generateAndSendOTP } from '@/lib/otp'

export async function POST(req: NextRequest) {
  try {
    const body = await readJson<{ portal?: 'ecl' | 'public'; email?: string; password?: string; mobile?: string; otp?: string }>(req)
    if (body?.portal === 'ecl') {
      if (!body.email || !body.password) return badRequest('email and password required for ECL portal')
      const user = await db.user.findUnique({ where: { email: body.email } })
      if (!user || !user.password_hash) return badRequest('Invalid email or password')
      
      const isPasswordValid = await bcrypt.compare(body.password, user.password_hash)
      if (!isPasswordValid) return badRequest('Invalid email or password')
      
      // Check if OTP is globally enabled or enabled for this user
      const sysConfig = await db.sys_config.findUnique({ where: { key: 'global_otp_enabled' } })
      const isGlobalOtpEnabled = sysConfig?.value === 'true'
      
      if (isGlobalOtpEnabled || user.otp_enabled) {
        const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;
        const userAgent = req.headers.get('user-agent') || undefined;
        const { sessionId, devOtp } = await generateAndSendOTP(user.id, 'auth', user.email || undefined, 'AUTH_LOGIN', { ipAddress, userAgent })
        return ok({ requireOtp: true, sessionId, devOtp, message: 'OTP sent to your registered contact.' })
      }

      const authUser = await createSession(user.id.toString())
      return ok({ user: { id: authUser.id, name: authUser.name, tenant_id: authUser.tenant_id, email: authUser.email, designation: authUser.designation }, message: `Welcome back, ${authUser.name}` })
    }
    if (body?.portal === 'public') {
      if (!body.mobile) return badRequest('mobile required for public portal')
      const user = await db.user.findUnique({ where: { mobile: body.mobile } })
      if (!user) return badRequest('Mobile number not registered. Please register first.')
      
      const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;
      const userAgent = req.headers.get('user-agent') || undefined;
      const { sessionId, devOtp } = await generateAndSendOTP(user.id, 'auth', user.mobile || undefined, 'AUTH_LOGIN', { ipAddress, userAgent })
      return ok({ requireOtp: true, sessionId, devOtp, message: 'OTP sent to your mobile number.' })
    }
    return badRequest('portal must be "ecl" or "public"')
  } catch (e) {
    return serverError('Login failed', e instanceof Error ? e.message : String(e))
  }
}
