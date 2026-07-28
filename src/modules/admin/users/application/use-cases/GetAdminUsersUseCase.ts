import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { IAdminUserRepository } from '../../domain/repositories/IAdminUserRepository'
import { AdminUser } from '../../domain/entities/AdminUser'

export class GetAdminUsersUseCase implements IUseCase<{ page?: number, limit?: number, search?: string, status?: 'verified' | 'unverified' }, { data: any[], total: number, unverifiedCount: number }> {
  constructor(private readonly repo: IAdminUserRepository) {}

  async execute(req?: { page?: number, limit?: number, search?: string, status?: 'verified' | 'unverified' }): Promise<Result<{ data: any[], total: number, unverifiedCount: number }>> {
    try {
      const page = req?.page || 1;
      const limit = req?.limit || 15;
      
      const { data: users, total, unverifiedCount } = await this.repo.findPaginated({
        page,
        limit,
        search: req?.search,
        status: req?.status
      })
      // Map domain entities to DTOs for the API response
      const dtos = users.map(user => ({
        id: user.id,
        tenant_id: user.tenantId,
        tenant_name: user.tenantName,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        designation: user.designation,
        is_active: user.isActive,
        is_online: user.isOnline,
        verified_at: user.verifiedAt,
        scope: user.scope,
        role: user.role
      }))
      return Ok({ data: dtos, total, unverifiedCount })
    } catch (e: any) {
      return Fail(e.message)
    }
  }
}
