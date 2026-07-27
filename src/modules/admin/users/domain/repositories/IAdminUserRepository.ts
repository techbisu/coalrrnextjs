import { AdminUser } from '../entities/AdminUser'

export interface IAdminUserRepository {
  findAll(): Promise<AdminUser[]>
  findById(id: string | number): Promise<AdminUser | null>
  create(user: AdminUser): Promise<AdminUser>
  update(user: AdminUser): Promise<AdminUser>
  delete(id: string | number): Promise<void>
}
