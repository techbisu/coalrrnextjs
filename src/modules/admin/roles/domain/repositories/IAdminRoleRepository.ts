import { AdminRole } from '../entities/AdminRole'
import { AdminPermission } from '../entities/AdminPermission'

export interface IAdminRoleRepository {
  findAllRoles(): Promise<AdminRole[]>
  findRoleById(id: string): Promise<AdminRole | null>
  findAllPermissions(): Promise<AdminPermission[]>
  findPermissionById(id: string): Promise<AdminPermission | null>
  createRole(role: AdminRole): Promise<AdminRole>
  updateRole(role: AdminRole): Promise<AdminRole>
  deleteRole(id: string): Promise<void>
  
  createPermission(permission: AdminPermission): Promise<AdminPermission>
  updatePermission(permission: AdminPermission): Promise<AdminPermission>
  deletePermission(id: string): Promise<void>
}
