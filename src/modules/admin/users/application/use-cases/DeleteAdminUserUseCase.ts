import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { IAdminUserRepository } from '../../domain/repositories/IAdminUserRepository'
import { Container } from '@/infrastructure/di/modules/core.di'

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

      await this.repo.delete(request.id)
      
      await Container.jobDispatcher.dispatch('auditLog', {
        type: 'CUSTOM_ACTIVITY',
        payload: {
          activity: `Deleted user ${existingUser.name}`,
          userId: request.action_by,
          module: 'admin-users',
          entityType: 'user',
          entityId: request.id,
        }
      })
      return Ok(undefined)
    } catch (e: any) {
      return Fail(e.message)
    }
  }
}
