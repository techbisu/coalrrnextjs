import { user } from '@prisma/client'

export interface IAdminUserRepository {
  findAll(): Promise<user[]>
  findById(id: string): Promise<user | null>
  create(data: Omit<user, 'id' | 'entry_ts' | 'updt_ts'>): Promise<user>
  update(id: string, data: Partial<user>): Promise<user>
  delete(id: string): Promise<void>
}
