// POST /api/auth/register — Public citizen registration
import { db } from '@/lib/db'
import { createSession } from '@/lib/auth'
import { ok, badRequest, serverError, readJson } from '../../_lib'
import { createHash } from 'crypto'
import type { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await readJson<{ aadhaarNumber?: string; name?: string; mobile?: string; plotId?: string; otp?: string }>(req)
    if (!body?.aadhaarNumber || !body.name || !body.mobile) return badRequest('aadhaarNumber, name, mobile required')
    const cleaned = body.aadhaarNumber.replace(/\D/g, '')
    if (cleaned.length !== 12) return badRequest('Aadhaar must be 12 digits')
    if (!/^\d{10}$/.test(body.mobile)) return badRequest('Mobile must be 10 digits')
    if (!body.otp || !/^\d{6}$/.test(body.otp)) return badRequest('Valid 6-digit OTP required')
    const aadhaarHash = createHash('sha256').update(body.aadhaarNumber).digest('hex').slice(0, 16)
    const existing = await db.user.findUnique({ where: { aadhaarHash } })
    if (existing) return badRequest('Aadhaar already registered. Please login instead.')
    const existingMobile = await db.user.findUnique({ where: { mobile: body.mobile } })
    if (existingMobile) return badRequest('Mobile number already registered.')
    const user = await db.user.create({
      data: { portal: 'public', role: 'citizen', name: body.name, mobile: body.mobile, aadhaarHash, plotId: body.plotId ?? null, verifiedAt: new Date() },
    })
    const authUser = await createSession(user.id)
    return ok({ user: { id: authUser.id, name: authUser.name, portal: authUser.portal, role: authUser.role, mobile: authUser.mobile }, message: 'Registration successful.' }, { status: 201 })
  } catch (e) {
    return serverError('Registration failed', e instanceof Error ? e.message : String(e))
  }
}
