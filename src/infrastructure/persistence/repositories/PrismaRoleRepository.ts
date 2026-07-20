import { db } from '@/lib/db'
import { IRole } from '@/core/authorization/types'
import { IRoleRepository } from '@/core/authorization/interfaces/IRoleRepository'
import { PermissionCache } from '@/core/authorization/cache/PermissionCache'

export class PrismaRoleRepository implements IRoleRepository {
  async findById(id: string): Promise<any | null> {
    return db.role.findUnique({ where: { id }, include: { role_has_permission: { include: { permission: true } } } })
  }

  async findByName(name: string, guard_name: string = 'web'): Promise<IRole | null> {
    return db.role.findUnique({ where: { name_guard_name: { name, guard_name } } })
  }

  async findAll(): Promise<any[]> {
    return db.role.findMany({
      orderBy: [{ is_system: 'desc' }, { name: 'asc' }],
      include: { _count: { select: { model_has_role: true, role_has_permission: true } } }
    })
  }

  async create(data: Omit<IRole, 'id' | 'entry_ts' | 'updt_ts' | 'is_system'>): Promise<IRole> {
    return db.role.create({ data })
  }

  async update(id: string, data: Partial<Omit<IRole, 'id' | 'entry_ts' | 'updt_ts' | 'is_system'>>): Promise<IRole> {
    return db.role.update({ where: { id }, data })
  }

  async delete(id: string): Promise<IRole> {
    return db.role.delete({ where: { id } })
  }

  async findByUser(user_id: string): Promise<IRole[]> {
    const userRoles = await db.model_has_role.findMany({
      where: { model_id: user_id, model_type: 'user' },
      include: { role: true }
    })
    return userRoles.map(ur => ur.role)
  }

  async getUsersByRoleId(role_id: string): Promise<string[]> {
    const users = await db.model_has_role.findMany({ where: { role_id } })
    return users.map(u => u.model_id)
  }

  async assignToUser(user_id: string, role_id: string): Promise<void> {
    await db.model_has_role.upsert({
      where: { role_id_model_type_model_id: { role_id, model_type: 'user', model_id: user_id } },
      create: { role_id, model_type: 'user', model_id: user_id },
      update: {}
    })
    await PermissionCache.invalidate(user_id)
  }

  async syncUserRoles(user_id: string, roleIds: string[]): Promise<void> {
    await db.model_has_role.deleteMany({ where: { model_id: user_id, model_type: 'user' } })
    if (roleIds.length > 0) {
      const now = new Date()
      await db.model_has_role.createMany({
        data: roleIds.map(role_id => ({ role_id, model_type: 'user', model_id: user_id, updt_ts: now }))
      })
    }
    await PermissionCache.invalidate(user_id)
  }

  async syncPermissions(role_id: string, permissionIds: string[]): Promise<void> {
    await db.role_has_permission.deleteMany({ where: { role_id } })
    if (permissionIds.length > 0) {
      const now = new Date()
      // Force Turbopack reload to include updt_ts
      await db.role_has_permission.createMany({
        data: permissionIds.map(permission_id => ({ role_id, permission_id, updt_ts: now }))
      })
    }
    // Clear ALL caches because role permissions affect all users with this role
    await PermissionCache.invalidateAll()
  }

  async findRolesByNames(names: string[]): Promise<IRole[]> {
    return db.role.findMany({ where: { name: { in: names } } })
  }
}
