import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { IAdminUserRepository } from '../../domain/repositories/IAdminUserRepository'
import { AuditService } from '@/core/audit/services/AuditService'

export interface DeleteAdminUserRequest {
  id: string
  action_by: string
}

export class DeleteAdminUserUseCase implements IUseCase<DeleteAdminUserRequest, void> {
  constructor(private readonly repo: IAdminUserRepository) {}

  async execute(request: DeleteAdminUserRequest): Promise<Result<void>> {
    try {
      const existingUser = await this.repo.findById(request.id)
      if (!existingUser) {
        return Fail("User not found")
      }

      // Hard delete as per repo method, although soft delete might be preferred long-term
      await this.repo.delete(request.id)
      
      AuditService.log('DELETE', 'admin-users', 'user', request.id, `Deleted user ${existingUser.name}`, { user_id: request.action_by })
      
      return Ok()
    } catch (e: any) {
      return Fail(e.message)
    }
  }
}
