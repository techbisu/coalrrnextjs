import { role, permission } from '@prisma/client'

export interface IAdminRoleRepository {
  findAllRoles(): Promise<role[]>
  findAllPermissions(): Promise<permission[]>
  createRole(data: Omit<role, 'id' | 'entry_ts' | 'updt_ts'>): Promise<role>
  updateRole(id: string, data: Partial<role>): Promise<role>
  createPermission(data: Omit<permission, 'id' | 'entry_ts' | 'updt_ts'>): Promise<permission>
}
