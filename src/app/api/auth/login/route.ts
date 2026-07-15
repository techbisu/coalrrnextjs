// POST /api/auth/login — Login for ECL (email+password) and citizens (mobile+OTP)
import { db } from '@/lib/db'
import { createSession } from '@/lib/auth'
import { ok, badRequest, serverError, readJson } from '../../_lib'
import { createHash } from 'crypto'
import type { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await readJson<{ portal?: 'ecl' | 'public'; email?: string; password?: string; mobile?: string; otp?: string }>(req)
    if (body?.portal === 'ecl') {
      if (!body.email || !body.password) return badRequest('email and password required for ECL portal')
      const password_hash = createHash('sha256').update(body.password).digest('hex')
      const user = await db.user.findUnique({ where: { email: body.email } })
      if (!user || user.portal !== 'ecl' || user.password_hash !== password_hash) return badRequest('Invalid email or password')
      const authUser = await createSession(user.id)
      return ok({ user: { id: authUser.id, name: authUser.name, portal: authUser.portal, role: authUser.role, email: authUser.email, designation: authUser.designation, mine_cd: authUser.mine_cd }, message: `Welcome back, ${authUser.name}` })
    }
    if (body?.portal === 'public') {
      if (!body.mobile || !body.otp) return badRequest('mobile and otp required for public portal')
      if (!/^\d{6}$/.test(body.otp)) return badRequest('OTP must be 6 digits')
      const user = await db.user.findUnique({ where: { mobile: body.mobile } })
      if (!user || user.portal !== 'public') return badRequest('Mobile number not registered. Please register first.')
      const authUser = await createSession(user.id)
      return ok({ user: { id: authUser.id, name: authUser.name, portal: authUser.portal, role: authUser.role, mobile: authUser.mobile, plot_id: authUser.plot_id }, message: `Welcome, ${authUser.name}` })
    }
    return badRequest('portal must be "ecl" or "public"')
  } catch (e) {
    return serverError('Login failed', e instanceof Error ? e.message : String(e))
  }
}
