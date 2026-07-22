import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { IAdminUserRepository } from '../../domain/repositories/IAdminUserRepository'
import { user } from '@prisma/client'
import { AuditService } from '@/core/audit/services/AuditService'

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

export class UpdateAdminUserUseCase implements IUseCase<UpdateAdminUserRequest, user> {
  constructor(private readonly repo: IAdminUserRepository) {}

  async execute(request: UpdateAdminUserRequest): Promise<Result<user>> {
    try {
      const existingUser = await this.repo.findById(request.id)
      if (!existingUser) {
        return Fail("User not found")
      }

      const updateData: Partial<user> = {
        updt_by: request.action_by,
      }

      if (request.portal !== undefined) updateData.portal = request.portal
      if (request.role !== undefined) updateData.role = request.role
      if (request.name !== undefined) updateData.name = request.name
      if (request.email !== undefined) updateData.email = request.email || null
      if (request.mobile !== undefined) updateData.mobile = request.mobile || null
      if (request.designation !== undefined) updateData.designation = request.designation || null
      if (request.mine_cd !== undefined) updateData.mine_cd = request.mine_cd || null

      const updatedUser = await this.repo.update(request.id, updateData)
      
      AuditService.log('UPDATE', 'admin-users', 'user', updatedUser.id.toString(), `Updated user ${updatedUser.name}`, { user_id: request.action_by })
      
      return Ok(updatedUser)
    } catch (e: any) {
      if (e.code === 'P2002') {
        return Fail("A user with this email or mobile already exists.")
      }
      return Fail(e.message)
    }
  }
}
