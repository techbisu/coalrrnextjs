import { IRole } from '../types'

export interface IRoleRepository {
  findById(id: string): Promise<any | null> // Returns full role with permissions if needed
  findByName(name: string, guard_name?: string): Promise<IRole | null>
  findAll(): Promise<any[]>
  create(data: Omit<IRole, 'id' | 'entry_ts' | 'updt_ts' | 'is_system'>): Promise<IRole>
  update(id: string, data: Partial<Omit<IRole, 'id' | 'entry_ts' | 'updt_ts' | 'is_system'>>): Promise<IRole>
  delete(id: string): Promise<IRole>
  findByUser(user_id: string): Promise<IRole[]>
  getUsersByRoleId(role_id: string): Promise<string[]>
  assignToUser(user_id: string, role_id: string): Promise<void>
  syncUserRoles(user_id: string, roleIds: string[]): Promise<void>
  syncPermissions(role_id: string, permissionIds: string[]): Promise<void>
  findRolesByNames(names: string[]): Promise<IRole[]>
}
