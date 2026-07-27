import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { IAdminUserRepository } from '../../domain/repositories/IAdminUserRepository'
import { AdminUser, CreateAdminUserProps } from '../../domain/entities/AdminUser'
import { Container } from '@/infrastructure/di/modules/core.di'

export interface CreateAdminUserRequest extends CreateAdminUserProps {}

export interface CreateAdminUserResponse {
  id: number
  name: string
  message: string
}

export class CreateAdminUserUseCase implements IUseCase<CreateAdminUserRequest, CreateAdminUserResponse> {
  constructor(private readonly repo: IAdminUserRepository) {}

  async execute(request: CreateAdminUserRequest): Promise<Result<CreateAdminUserResponse>> {
    const userResult = AdminUser.create(request)
    
    if (userResult.isFailure) {
      return Fail(String(userResult.error))
    }

    const user = userResult.value

    try {
      const persistedUser = await this.repo.create(user)
      
      await Container.jobDispatcher.dispatch('auditLog', {
        type: 'CUSTOM_ACTIVITY',
        payload: {
          activity: `Created user ${persistedUser.name}`,
          userId: request.action_by,
          module: 'admin-users',
          entityType: 'user',
          entityId: persistedUser.id.toString(),
        }
      })
      
      return Ok({
        id: persistedUser.id,
        name: persistedUser.name,
        message: 'Admin user created successfully'
      })
    } catch (e: any) {
      if (e.code === 'P2002') {
        return Fail("A user with this email or mobile already exists.")
      }
      return Fail(e.message)
    }
  }
}
