// COALRR Auth — server-side session helpers (cookie-based, spec §1)
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'
import { db } from '@/lib/db'

export const SESSION_COOKIE = 'coalrr_session'
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export interface AuthUser {
  id: string
  portal: 'ecl' | 'public'
  role: string
  email: string | null
  mobile: string | null
  name: string
  designation: string | null
  collieryCode: string | null
  plotId: string | null
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  const session = await db.authSession.findUnique({
    where: { token },
    include: { user: true },
  })
  if (!session || session.expiresAt < new Date()) return null
  const u = session.user
  return {
    id: u.id, portal: u.portal as 'ecl' | 'public', role: u.role,
    email: u.email, mobile: u.mobile, name: u.name,
    designation: u.designation, collieryCode: u.collieryCode, plotId: u.plotId,
  }
}

export async function createSession(userId: string): Promise<AuthUser> {
  const token = randomUUID()
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
  await db.authSession.create({ data: { token, userId, expiresAt } })
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true, sameSite: 'lax', path: '/', expires: expiresAt,
  })
  const u = await db.user.findUnique({ where: { id: userId } })
  if (!u) throw new Error('User vanished')
  return {
    id: u.id, portal: u.portal as 'ecl' | 'public', role: u.role,
    email: u.email, mobile: u.mobile, name: u.name,
    designation: u.designation, collieryCode: u.collieryCode, plotId: u.plotId,
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (token) {
    await db.authSession.deleteMany({ where: { token } }).catch(() => {})
  }
  cookieStore.delete(SESSION_COOKIE)
}

export const ROLE_LABELS: Record<string, string> = {
  unit_office: 'Unit Office', area_office: 'Area Office',
  gm_planning: 'GM (Planning)', gm_finance: 'GM (Finance)',
  gm_safety: 'GM (Safety)', director: 'Director', cmd: 'CMD',
  board: 'Board of Directors', citizen: 'Citizen',
}
