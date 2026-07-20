import { IAdminRoleRepository } from '../../domain/repositories/IAdminRoleRepository'
import { role, permission } from '@prisma/client'
import { db } from '@/lib/db'

export class PrismaAdminRoleRepository implements IAdminRoleRepository {
  async findAllRoles(): Promise<role[]> {
    return await db.role.findMany({ orderBy: { name: 'asc' } })
  }
  
  async findAllPermissions(): Promise<permission[]> {
    return await db.permission.findMany({ orderBy: [ { group: 'asc' }, { name: 'asc' } ] })
  }
  
  async createRole(data: Omit<role, 'id' | 'entry_ts' | 'updt_ts'>): Promise<role> {
    return await db.role.create({ data })
  }
  
  async updateRole(id: string, data: Partial<role>): Promise<role> {
    return await db.role.update({ where: { id }, data })
  }
  
  async createPermission(data: Omit<permission, 'id' | 'entry_ts' | 'updt_ts'>): Promise<permission> {
    return await db.permission.create({ data })
  }

  async deleteRole(id: string): Promise<void> {
    await db.role.delete({ where: { id } })
  }

  async updatePermission(id: string, data: Partial<permission>): Promise<permission> {
    return await db.permission.update({ where: { id }, data })
  }

  async deletePermission(id: string): Promise<void> {
    await db.permission.delete({ where: { id } })
  }
}
