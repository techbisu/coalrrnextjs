import { IPermission } from '../types'

export interface IPermissionRepository {
  findById(id: string): Promise<IPermission | null>
  findByName(name: string, guard_name?: string): Promise<IPermission | null>
  findAll(): Promise<IPermission[]>
  create(data: Omit<IPermission, 'id' | 'entry_ts' | 'updt_ts'>): Promise<IPermission>
  update(id: string, data: Partial<Omit<IPermission, 'id' | 'entry_ts' | 'updt_ts'>>): Promise<IPermission>
  delete(id: string): Promise<IPermission>
  findByUser(user_id: string): Promise<IPermission[]>
  findPermissionsByNames(names: string[]): Promise<IPermission[]>
}
