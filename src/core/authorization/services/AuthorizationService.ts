import { db } from '@/lib/db'
import { PermissionCache } from '../cache/PermissionCache'
import { CachedPermissions } from '../types'
import { getCurrentUser } from '@/lib/auth'
import { forbidden } from '@/app/api/_lib'

export class AuthorizationService {
  static SUPER_ADMIN_ROLE = 'Super Administrator'

  /**
   * Main server-side guard. Throws or returns Next.js response if unauthorized.
   * Typical usage in API routes: await AuthorizationService.authorize('proposal.create')
   */
  static async authorize(permission: string, providedUserId?: string): Promise<void> {
    const userId = providedUserId || (await getCurrentUser())?.id
    if (!userId) throw new Error('Unauthorized')

    const hasAccess = await this.can(userId, permission)
    if (!hasAccess) {
      throw new Error(`Forbidden: requires permission ${permission}`)
    }
  }

  static async can(userId: string, permission: string): Promise<boolean> {
    if (await this.isSuperAdmin(userId)) return true
    const perms = await this.getUserPermissions(userId)
    return perms.includes(permission)
  }

  static async canAny(userId: string, permissions: string[]): Promise<boolean> {
    if (await this.isSuperAdmin(userId)) return true
    const perms = await this.getUserPermissions(userId)
    return permissions.some(p => perms.includes(p))
  }

  static async canAll(userId: string, permissions: string[]): Promise<boolean> {
    if (await this.isSuperAdmin(userId)) return true
    const perms = await this.getUserPermissions(userId)
    return permissions.every(p => perms.includes(p))
  }

  static async cannot(userId: string, permission: string): Promise<boolean> {
    return !(await this.can(userId, permission))
  }

  static async hasRole(userId: string, role: string): Promise<boolean> {
    const roles = await this.getUserRoles(userId)
    return roles.includes(role)
  }

  static async hasAnyRole(userId: string, rolesToCheck: string[]): Promise<boolean> {
    const roles = await this.getUserRoles(userId)
    return rolesToCheck.some(r => roles.includes(r))
  }

  static async isSuperAdmin(userId: string): Promise<boolean> {
    return this.hasRole(userId, this.SUPER_ADMIN_ROLE)
  }

  static async getUserPermissions(userId: string): Promise<string[]> {
    const cached = await this.loadUserContext(userId)
    return cached.permissions
  }

  static async getUserRoles(userId: string): Promise<string[]> {
    const cached = await this.loadUserContext(userId)
    return cached.roles
  }

  private static async loadUserContext(userId: string): Promise<CachedPermissions> {
    const cached = await PermissionCache.get(userId)
    if (cached) return cached

    // Load from DB
    const userRoles = await db.modelHasRole.findMany({
      where: { modelId: userId, modelType: 'User' },
      include: { 
        role: { 
          include: { 
            permissions: { include: { permission: true } } 
          } 
        } 
      }
    })

    const directPerms = await db.modelHasPermission.findMany({
      where: { modelId: userId, modelType: 'User' },
      include: { permission: true }
    })

    const roles = userRoles.map(ur => ur.role.name)
    const permissions = new Set<string>()

    // Add inherited permissions
    userRoles.forEach(ur => {
      ur.role.permissions.forEach(rp => {
        permissions.add(rp.permission.name)
      })
    })

    // Add direct permissions
    directPerms.forEach(dp => {
      permissions.add(dp.permission.name)
    })

    const data: CachedPermissions = {
      roles,
      permissions: Array.from(permissions)
    }

    await PermissionCache.set(userId, data)
    return data
  }
}
