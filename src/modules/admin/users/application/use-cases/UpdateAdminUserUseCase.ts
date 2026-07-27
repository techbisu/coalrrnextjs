import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { IAdminUserRepository } from '../../domain/repositories/IAdminUserRepository'
import { user } from '@prisma/client'
import { Container } from '@/infrastructure/di/modules/core.di'

export interface UpdateAdminUserRequest {
  id: string
  portal?: string
  role?: string
  name?: string
  email?: string
  mobile?: string
  designation?: string
  mine_cd?: string
  action_by: string
}

export class UpdateAdminUserUseCase implements IUseCase<UpdateAdminUserRequest, any> {
  constructor(private readonly repo: IAdminUserRepository) {}

  async execute(request: UpdateAdminUserRequest): Promise<Result<any>> {
    try {
      const existingUser = await this.repo.findById(request.id)
      if (!existingUser) {
        return Fail("User not found")
      }

      existingUser.update({
        portal: request.portal,
        role: request.role,
        name: request.name,
        email: request.email,
        mobile: request.mobile,
        designation: request.designation,
        mineCd: request.mine_cd,
        updtBy: request.action_by,
      })

      const updatedUser = await this.repo.update(existingUser)
      
      await Container.jobDispatcher.dispatch('auditLog', {
        type: 'CUSTOM_ACTIVITY',
        payload: {
          activity: `Updated user ${updatedUser.name}`,
          userId: request.action_by,
          module: 'admin-users',
          entityType: 'user',
          entityId: updatedUser.id.toString(),
        }
      })
      return Ok({
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        mobile: updatedUser.mobile,
        portal: updatedUser.portal,
        role: updatedUser.role,
        designation: updatedUser.designation,
        mine_cd: updatedUser.mineCd,
        is_active: updatedUser.isActive
      })
    } catch (e: any) {
      if (e.code === 'P2002') {
        return Fail("A user with this email or mobile already exists.")
      }
      return Fail(e.message)
    }
  }
}

