import { IRoleRepository } from '../interfaces/IRoleRepository'
import { IPermissionRepository } from '../interfaces/IPermissionRepository'
import { PermissionCache } from '../cache/PermissionCache'

export class RoleService {
  constructor(
    private roleRepo: IRoleRepository,
    private permissionRepo: IPermissionRepository
  ) {}

  async create(data: any) {
    return this.roleRepo.create(data)
  }

  async update(id: string, data: any) {
    const role = await this.roleRepo.findById(id)
    if (!role) throw new Error('role not found')
    if (role.is_system) throw new Error('Cannot modify system roles')
    return this.roleRepo.update(id, data)
  }

  async delete(id: string) {
    const role = await this.roleRepo.findById(id)
    if (!role) throw new Error('role not found')
    if (role.is_system) throw new Error('Cannot delete system roles')
    
    // Invalidate cache for all users with this role before deleting
    const users = await this.roleRepo.getUsersByRoleId(id)
    await this.roleRepo.delete(id)
    for (const user_id of users) {
      await PermissionCache.invalidate(user_id)
    }
  }

  async assignToUser(user_id: string, roleName: string) {
    const role = await this.roleRepo.findByName(roleName)
    if (!role) throw new Error(`role ${roleName} not found`)
    
    await this.roleRepo.assignToUser(user_id, role.id)
    await PermissionCache.invalidate(user_id)
  }

  async syncUserRoles(user_id: string, roleNames: string[]) {
    if (roleNames.length > 0) {
      const roles = await this.roleRepo.findRolesByNames(roleNames)
      await this.roleRepo.syncUserRoles(user_id, roles.map(r => r.id))
    } else {
      await this.roleRepo.syncUserRoles(user_id, [])
    }
    
    await PermissionCache.invalidate(user_id)
  }

  async syncPermissions(role_id: string, permissionNames: string[]) {
    if (permissionNames.length > 0) {
      const perms = await this.permissionRepo.findPermissionsByNames(permissionNames)
      await this.roleRepo.syncPermissions(role_id, perms.map(p => p.id))
    } else {
      await this.roleRepo.syncPermissions(role_id, [])
    }
    
    // Cache invalidation for users holding this role
    const users = await this.roleRepo.getUsersByRoleId(role_id)
    for (const user_id of users) {
      await PermissionCache.invalidate(user_id)
    }
  }
}
