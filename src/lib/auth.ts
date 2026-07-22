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
  scope: any // EffectiveScope from UserScopeService
}

import { authService, userOrgScopeRepositoryExport } from '@/infrastructure/di/Container'
import { cache } from 'react'
import { UserScopeService } from '@/core/authorization/services/UserScopeService'

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
  const roles = await authService.getUserRoles(u.id.toString())
  const permissions = await authService.getUserPermissions(u.id.toString())
  
  // Load Org Scope
  const activeScope = await userOrgScopeRepositoryExport.getActiveScopeByUserId(u.id.toString())
  const scope = UserScopeService.buildEffectiveScope(activeScope ? [activeScope] : [])
  
  return {
    id: u.id.toString(), portal: u.portal as 'ecl' | 'public', role: u.role,
    roles, permissions,
    email: u.email, mobile: u.mobile, name: u.name,
    designation: u.designation, mine_cd: u.mine_cd, plot_id: u.plot_id,
    scope
  }
})

export async function createSession(user_id: string): Promise<AuthUser> {
  const token = randomUUID()
  const expires_at = new Date(Date.now() + SESSION_TTL_MS)
  const numericId = parseInt(user_id, 10);
  if (isNaN(numericId)) throw new Error('Invalid user ID');
  await db.auth_session.create({ data: { id: randomUUID(), token, user_id: numericId, expires_at, updt_ts: new Date() } })
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true, sameSite: 'lax', path: '/', expires: expires_at, secure: process.env.NODE_ENV === 'production',
  })
  const u = await db.user.findUnique({ where: { id: numericId } })
  if (!u) throw new Error('user vanished')
    
  // Load full RBAC profile
  const roles = await authService.getUserRoles(u.id.toString())
  const permissions = await authService.getUserPermissions(u.id.toString())

  // Load Org Scope
  const activeScope = await userOrgScopeRepositoryExport.getActiveScopeByUserId(u.id.toString())
  const scope = UserScopeService.buildEffectiveScope(activeScope ? [activeScope] : [])

  return {
    id: u.id.toString(), portal: u.portal as 'ecl' | 'public', role: u.role,
    roles, permissions,
    email: u.email, mobile: u.mobile, name: u.name,
    designation: u.designation, mine_cd: u.mine_cd, plot_id: u.plot_id,
    scope
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
