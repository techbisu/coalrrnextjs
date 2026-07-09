import { db } from '@/lib/db'
import { RoleRepository } from '../repositories/RoleRepository'
import { PermissionCache } from '../cache/PermissionCache'

export class RoleService {
  static async create(data: any) {
    return RoleRepository.create(data)
  }

  static async update(id: string, data: any) {
    const role = await RoleRepository.findById(id)
    if (!role) throw new Error('Role not found')
    if (role.isSystem) throw new Error('Cannot modify system roles')
    return RoleRepository.update(id, data)
  }

  static async delete(id: string) {
    const role = await RoleRepository.findById(id)
    if (!role) throw new Error('Role not found')
    if (role.isSystem) throw new Error('Cannot delete system roles')
    
    // Invalidate cache for all users with this role before deleting
    const users = await db.modelHasRole.findMany({ where: { roleId: id } })
    await RoleRepository.delete(id)
    for (const u of users) {
      await PermissionCache.invalidate(u.modelId)
    }
  }

  static async assignToUser(userId: string, roleName: string) {
    const role = await RoleRepository.findByName(roleName)
    if (!role) throw new Error(`Role ${roleName} not found`)
    
    await db.modelHasRole.upsert({
      where: { roleId_modelType_modelId: { roleId: role.id, modelType: 'User', modelId: userId } },
      create: { roleId: role.id, modelType: 'User', modelId: userId },
      update: {}
    })
    
    await PermissionCache.invalidate(userId)
  }

  static async syncUserRoles(userId: string, roleNames: string[]) {
    // Delete existing
    await db.modelHasRole.deleteMany({ where: { modelId: userId, modelType: 'User' } })
    
    if (roleNames.length > 0) {
      const roles = await db.role.findMany({ where: { name: { in: roleNames } } })
      await db.modelHasRole.createMany({
        data: roles.map(r => ({ roleId: r.id, modelType: 'User', modelId: userId }))
      })
    }
    
    await PermissionCache.invalidate(userId)
  }

  static async syncPermissions(roleId: string, permissionNames: string[]) {
    await db.roleHasPermission.deleteMany({ where: { roleId } })
    
    if (permissionNames.length > 0) {
      const perms = await db.permission.findMany({ where: { name: { in: permissionNames } } })
      await db.roleHasPermission.createMany({
        data: perms.map(p => ({ roleId, permissionId: p.id }))
      })
    }
    
    // Cache invalidation for users holding this role
    const users = await db.modelHasRole.findMany({ where: { roleId } })
    for (const u of users) {
      await PermissionCache.invalidate(u.modelId)
    }
  }
}
