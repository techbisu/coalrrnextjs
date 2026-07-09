import { db } from '@/lib/db'
import { PermissionRepository } from '../repositories/PermissionRepository'
import { PermissionCache } from '../cache/PermissionCache'

export class PermissionService {
  static async create(data: any) {
    return PermissionRepository.create(data)
  }

  static async update(id: string, data: any) {
    return PermissionRepository.update(id, data)
  }

  static async delete(id: string) {
    const users = await db.modelHasPermission.findMany({ where: { permissionId: id } })
    const roles = await db.roleHasPermission.findMany({ where: { permissionId: id }, include: { role: { include: { users: true } } } })
    
    await PermissionRepository.delete(id)
    
    // Invalidate caches
    for (const u of users) await PermissionCache.invalidate(u.modelId)
    for (const rp of roles) {
      for (const ru of rp.role.users) {
        await PermissionCache.invalidate(ru.modelId)
      }
    }
  }

  static async getMatrix() {
    const permissions = await db.permission.findMany({ orderBy: [{ module: 'asc' }, { name: 'asc' }] })
    const roles = await db.role.findMany({ include: { permissions: true }, orderBy: { name: 'asc' } })
    
    const matrix: any = {}
    for (const perm of permissions) {
      matrix[perm.name] = {}
      for (const role of roles) {
        matrix[perm.name][role.name] = role.permissions.some(rp => rp.permissionId === perm.id)
      }
    }
    
    return {
      permissions: permissions.map(p => p.name),
      roles: roles.map(r => r.name),
      matrix
    }
  }
}
