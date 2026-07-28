import { AdminUser } from '../entities/AdminUser'

export interface IAdminUserRepository {
  findAll(): Promise<AdminUser[]>
  findPaginated(params: { page: number, limit: number, search?: string, status?: 'verified' | 'unverified' }): Promise<{ data: AdminUser[], total: number, unverifiedCount: number }>
  findById(id: string | number): Promise<AdminUser | null>
  create(user: AdminUser): Promise<AdminUser>
  update(user: AdminUser): Promise<AdminUser>
  delete(id: string | number): Promise<void>
}
