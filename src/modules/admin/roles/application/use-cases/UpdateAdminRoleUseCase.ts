import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { IAdminRoleRepository } from '../../domain/repositories/IAdminRoleRepository'
import { role } from '@prisma/client'
import { auditQueue } from '@/infrastructure/di/Container'

type UpdateRoleInput = {
  id: string
  name?: string
  display_name?: string
  description?: string
}

export class UpdateAdminRoleUseCase implements IUseCase<UpdateRoleInput, role> {
  constructor(private readonly repo: IAdminRoleRepository) {}

  async execute(input: UpdateRoleInput, context?: any): Promise<Result<role>> {
    try {
      const data: Partial<role> = {}
      if (input.name !== undefined) data.name = input.name
      if (input.display_name !== undefined) data.display_name = input.display_name
      if (input.description !== undefined) data.description = input.description

      const role = await this.repo.updateRole(input.id, data)

      auditQueue.push({
        action: 'UPDATE_ROLE',
        module_name: 'Admin',
        entity_name: 'role',
        entity_id: role.id,
        user_id: context?.user?.id || 'system',
        remarks: `Role updated: ${role.name}`
      })

      return Ok(role)
    } catch (e: any) {
      return Fail(e.message)
    }
  }
}
