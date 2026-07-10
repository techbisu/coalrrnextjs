import { IPermissionRepository } from '../interfaces/IPermissionRepository'
import { IRoleRepository } from '../interfaces/IRoleRepository'
import { PermissionCache } from '../cache/PermissionCache'
import { CachedPermissions } from '../types'
import { getCurrentUser } from '@/lib/auth'

export class AuthorizationService {
  public static readonly SUPER_ADMIN_ROLE = 'Super Administrator'

  constructor(
    private roleRepo: IRoleRepository,
    private permissionRepo: IPermissionRepository
  ) {}

  /**
   * Main server-side guard. Throws if unauthorized.
   * Typical usage in API routes: await authService.authorize('proposal.create')
   */
  async authorize(permission: string, providedUserId?: string): Promise<void> {
    const user_id = providedUserId || (await getCurrentUser())?.id
    if (!user_id) throw new Error('Unauthorized')

    const hasAccess = await this.can(user_id, permission)
    if (!hasAccess) {
      throw new Error(`Forbidden: requires permission ${permission}`)
    }
  }

  async can(user_id: string, permission: string): Promise<boolean> {
    if (await this.isSuperAdmin(user_id)) return true
    const perms = await this.getUserPermissions(user_id)
    return perms.includes(permission)
  }

  async canAny(user_id: string, permissions: string[]): Promise<boolean> {
    if (await this.isSuperAdmin(user_id)) return true
    const perms = await this.getUserPermissions(user_id)
    return permissions.some(p => perms.includes(p))
  }

  async canAll(user_id: string, permissions: string[]): Promise<boolean> {
    if (await this.isSuperAdmin(user_id)) return true
    const perms = await this.getUserPermissions(user_id)
    return permissions.every(p => perms.includes(p))
  }

  async cannot(user_id: string, permission: string): Promise<boolean> {
    return !(await this.can(user_id, permission))
  }

  async hasRole(user_id: string, role: string): Promise<boolean> {
    const roles = await this.getUserRoles(user_id)
    return roles.includes(role)
  }

  async hasAnyRole(user_id: string, rolesToCheck: string[]): Promise<boolean> {
    const roles = await this.getUserRoles(user_id)
    return rolesToCheck.some(r => roles.includes(r))
  }

  async isSuperAdmin(user_id: string): Promise<boolean> {
    return this.hasRole(user_id, AuthorizationService.SUPER_ADMIN_ROLE)
  }

  async getUserPermissions(user_id: string): Promise<string[]> {
    const cached = await this.loadUserContext(user_id)
    return cached.permissions
  }

  async getUserRoles(user_id: string): Promise<string[]> {
    const cached = await this.loadUserContext(user_id)
    return cached.roles
  }

  private async loadUserContext(user_id: string): Promise<CachedPermissions> {
    const cached = await PermissionCache.get(user_id)
    if (cached) return cached

    // Load from Repositories
    const userRoles = await this.roleRepo.findByUser(user_id)
    const directPerms = await this.permissionRepo.findByUser(user_id)

    // To get inherited permissions efficiently, we could fetch full role objects
    const fullRoles = await Promise.all(userRoles.map(r => this.roleRepo.findById(r.id)))

    const roles = userRoles.map(ur => ur.name)
    const permissions = new Set<string>()

    // Add inherited permissions
    fullRoles.forEach(fr => {
      if (fr && fr.permissions) {
        fr.permissions.forEach((rp: any) => {
          permissions.add(rp.permission.name)
        })
      }
    })

    // Add direct permissions
    directPerms.forEach(dp => {
      permissions.add(dp.name)
    })

    const data: CachedPermissions = {
      roles,
      permissions: Array.from(permissions)
    }

    await PermissionCache.set(user_id, data)
    return data
  }
}
