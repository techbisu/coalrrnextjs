import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { IAdminRoleRepository } from '../../domain/repositories/IAdminRoleRepository'
import { permission } from '@prisma/client'
import { auditQueue } from '@/infrastructure/di/Container'

type UpdatePermissionInput = {
  id: string
  name?: string
  display_name?: string
  module?: string
  group?: string
  description?: string
}

export class UpdateAdminPermissionUseCase implements IUseCase<UpdatePermissionInput, permission> {
  constructor(private readonly repo: IAdminRoleRepository) {}

  async execute(input: UpdatePermissionInput, context?: any): Promise<Result<permission>> {
    try {
      const data: Partial<permission> = {}
      if (input.name !== undefined) data.name = input.name
      if (input.display_name !== undefined) data.display_name = input.display_name
      if (input.module !== undefined) data.module = input.module
      if (input.group !== undefined) data.group = input.group
      if (input.description !== undefined) data.description = input.description

      const perm = await this.repo.updatePermission(input.id, data)

      auditQueue.push({
        action: 'UPDATE_PERMISSION',
        module_name: 'Admin',
        entity_name: 'permission',
        entity_id: perm.id,
        user_id: context?.user?.id || 'system',
        remarks: `Permission updated: ${perm.name}`
      })

      return Ok(perm)
    } catch (e: any) {
      return Fail(e.message)
    }
  }
}
