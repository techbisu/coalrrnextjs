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
  roles: string[]
  permissions: string[]
  email: string | null
  mobile: string | null
  name: string
  designation: string | null
  mine_cd: string | null
  plot_id: string | null
}

import { authService } from '@/infrastructure/di/Container'
import { cache } from 'react'

export const getCurrentUser = cache(async function (): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  const session = await db.auth_session.findUnique({
    where: { token },
    include: { user: true },
  })
  if (!session || session.expires_at < new Date()) return null
  const u = session.user
  
  // Load full RBAC profile
  const roles = await authService.getUserRoles(u.id)
  const permissions = await authService.getUserPermissions(u.id)
  
  return {
    id: u.id, portal: u.portal as 'ecl' | 'public', role: u.role,
    roles, permissions,
    email: u.email, mobile: u.mobile, name: u.name,
    designation: u.designation, mine_cd: u.mine_cd, plot_id: u.plot_id,
  }
})

export async function createSession(user_id: string): Promise<AuthUser> {
  const token = randomUUID()
  const expires_at = new Date(Date.now() + SESSION_TTL_MS)
  await db.auth_session.create({ data: { token, user_id, expires_at } })
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true, sameSite: 'lax', path: '/', expires: expires_at,
  })
  const u = await db.user.findUnique({ where: { id: user_id } })
  if (!u) throw new Error('user vanished')
    
  // Load full RBAC profile
  const roles = await authService.getUserRoles(u.id)
  const permissions = await authService.getUserPermissions(u.id)

  return {
    id: u.id, portal: u.portal as 'ecl' | 'public', role: u.role,
    roles, permissions,
    email: u.email, mobile: u.mobile, name: u.name,
    designation: u.designation, mine_cd: u.mine_cd, plot_id: u.plot_id,
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (token) {
    await db.auth_session.deleteMany({ where: { token } }).catch(() => {})
  }
  cookieStore.delete(SESSION_COOKIE)
}

export const ROLE_LABELS: Record<string, string> = {
  unit_office: 'Unit Office', area_office: 'Area Office',
  gm_planning: 'GM (Planning)', gm_finance: 'GM (Finance)',
  gm_safety: 'GM (Safety)', director: 'Director', cmd: 'CMD',
  board: 'Board of Directors', citizen: 'Citizen',
}
