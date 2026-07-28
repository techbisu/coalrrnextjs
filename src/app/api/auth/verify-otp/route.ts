import { db } from '@/lib/db'
import { createSession } from '@/lib/auth'
import { ok, badRequest, serverError, readJson } from '../../_lib'
import type { NextRequest } from 'next/server'
import { verifyOTP } from '@/lib/otp'

export async function POST(req: NextRequest) {
  try {
    const body = await readJson<{ sessionId?: string; otp?: string }>(req)

    if (!body?.sessionId || !body?.otp) {
      return badRequest('sessionId and otp are required')
    }

    if (!/^\d{6}$/.test(body.otp)) {
      return badRequest('OTP must be exactly 6 digits')
    }

    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;
    const userAgent = req.headers.get('user-agent') || undefined;
    const verification = await verifyOTP(body.sessionId, body.otp, { ipAddress, userAgent })

    if (!verification.success || !verification.session || !verification.session.user_id) {
      return badRequest(verification.error || 'Invalid OTP')
    }

    // OTP is valid! Log the user in.
    const user = await db.user.findUnique({ where: { id: verification.session.user_id } })
    if (!user) return badRequest('User not found')

    const authUser = await createSession(user.id.toString())

    if (user.tenant_id === 'ecl') {
      return ok({ 
        user: { 
          id: authUser.id, 
          name: authUser.name, 
          tenant_id: authUser.tenant_id, 
          email: authUser.email, 
          designation: authUser.designation
        }, 
        message: `Welcome back, ${authUser.name}` 
      })
    } else {
      return ok({ 
        user: { 
          id: authUser.id, 
          name: authUser.name, 
          tenant_id: authUser.tenant_id, 
          mobile: authUser.mobile
        }, 
        message: `Welcome, ${authUser.name}` 
      })
    }

  } catch (e) {
    return serverError('OTP Verification failed', e instanceof Error ? e.message : String(e))
  }
}
