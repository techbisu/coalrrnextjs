import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { IAdminUserRepository } from '../../domain/repositories/IAdminUserRepository'
import { user } from '@prisma/client'
import { randomUUID } from 'crypto'
import { AuditService } from '@/core/audit/services/AuditService'

export interface CreateAdminUserRequest {
  portal: string
  role: string
  name: string
  email?: string
  mobile?: string
  designation?: string
  mine_cd?: string
  action_by: string
}

export class CreateAdminUserUseCase implements IUseCase<CreateAdminUserRequest, user> {
  constructor(private readonly repo: IAdminUserRepository) {}

  async execute(request: CreateAdminUserRequest): Promise<Result<user>> {
    try {
      const newUser = await this.repo.create({
        id: randomUUID(),
        portal: request.portal,
        role: request.role,
        name: request.name,
        email: request.email || null,
        mobile: request.mobile || null,
        designation: request.designation || null,
        mine_cd: request.mine_cd || null,
        password_hash: null, // Left null until password set workflow
        aadhaar_hash: null,
        plot_id: null,
        verified_at: null,
        entry_by: request.action_by,
        updt_by: request.action_by,
      })
      
      AuditService.log('CREATE', 'admin-users', 'user', newUser.id, `Created user ${newUser.name}`, { user_id: request.action_by })
      
      return Ok(newUser)
    } catch (e: any) {
      if (e.code === 'P2002') {
        return Fail("A user with this email or mobile already exists.")
      }
      return Fail(e.message)
    }
  }
}
