import { IAdminRoleRepository } from '../../domain/repositories/IAdminRoleRepository'
import { AdminRole, AdminRoleProps } from '../../domain/entities/AdminRole'
import { AdminPermission, AdminPermissionProps } from '../../domain/entities/AdminPermission'
import { db } from '@/lib/db'

export class PrismaAdminRoleRepository implements IAdminRoleRepository {
  private mapRoleToDomain(dbRole: any): AdminRole {
    return AdminRole.reconstitute({
      id: dbRole.id,
      name: dbRole.name,
      displayName: dbRole.display_name,
      description: dbRole.description,
      guardName: dbRole.guard_name,
      isSystem: dbRole.is_system,
      entryBy: dbRole.entry_by,
      updtBy: dbRole.updt_by,
      entryTs: dbRole.entry_ts,
      updtTs: dbRole.updt_ts,
    })
  }

  private mapPermissionToDomain(dbPerm: any): AdminPermission {
    return AdminPermission.reconstitute({
      id: dbPerm.id,
      name: dbPerm.name,
      displayName: dbPerm.display_name,
      description: dbPerm.description,
      module: dbPerm.module,
      group: dbPerm.group,
      guardName: dbPerm.guard_name,
      entryBy: dbPerm.entry_by,
      updtBy: dbPerm.updt_by,
      entryTs: dbPerm.entry_ts,
      updtTs: dbPerm.updt_ts,
    })
  }

  async findAllRoles(): Promise<AdminRole[]> {
    const roles = await db.role.findMany({ orderBy: { name: 'asc' } })
    return roles.map(r => this.mapRoleToDomain(r))
  }

  async findRoleById(id: string): Promise<AdminRole | null> {
    const role = await db.role.findUnique({ where: { id } })
    return role ? this.mapRoleToDomain(role) : null
  }
  
  async findAllPermissions(): Promise<AdminPermission[]> {
    const permissions = await db.permission.findMany({ orderBy: [ { group: 'asc' }, { name: 'asc' } ] })
    return permissions.map(p => this.mapPermissionToDomain(p))
  }

  async findPermissionById(id: string): Promise<AdminPermission | null> {
    const perm = await db.permission.findUnique({ where: { id } })
    return perm ? this.mapPermissionToDomain(perm) : null
  }
  
  async createRole(role: AdminRole): Promise<AdminRole> {
    const dbRole = await db.role.create({ data: role.toPersistence() as any })
    return this.mapRoleToDomain(dbRole)
  }
  
  async updateRole(role: AdminRole): Promise<AdminRole> {
    const dbRole = await db.role.update({ 
      where: { id: role.id }, 
      data: role.toPersistence() as any 
    })
    return this.mapRoleToDomain(dbRole)
  }
  
  async createPermission(permission: AdminPermission): Promise<AdminPermission> {
    const dbPerm = await db.permission.create({ data: permission.toPersistence() as any })
    return this.mapPermissionToDomain(dbPerm)
  }

  async deleteRole(id: string): Promise<void> {
    await db.role.delete({ where: { id } })
  }

  async updatePermission(permission: AdminPermission): Promise<AdminPermission> {
    const dbPerm = await db.permission.update({ 
      where: { id: permission.id }, 
      data: permission.toPersistence() as any 
    })
    return this.mapPermissionToDomain(dbPerm)
  }

  async deletePermission(id: string): Promise<void> {
    await db.permission.delete({ where: { id } })
  }
}
