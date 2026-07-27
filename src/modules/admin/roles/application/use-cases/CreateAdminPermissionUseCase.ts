import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { IAdminRoleRepository } from '../../domain/repositories/IAdminRoleRepository'
import { AdminPermission } from '../../domain/entities/AdminPermission'
import { auditQueue } from '@/infrastructure/di/Container'

export type CreatePermissionInput = {
  name: string
  display_name: string
  module?: string
  group?: string
  description?: string
  actionBy?: string
}

export interface CreateAdminPermissionResponse {
  id: string
  name: string
}

export class CreateAdminPermissionUseCase implements IUseCase<CreatePermissionInput, CreateAdminPermissionResponse> {
  constructor(private readonly repo: IAdminRoleRepository) {}

  async execute(input: CreatePermissionInput, context?: any): Promise<Result<CreateAdminPermissionResponse>> {
    const permResult = AdminPermission.create({
      name: input.name,
      displayName: input.display_name,
      module: input.module,
      group: input.group,
      description: input.description,
      actionBy: input.actionBy || context?.user?.id || 'system'
    })

    if (permResult.isFailure) {
      return Fail(String(permResult.error))
    }

    try {
      const perm = await this.repo.createPermission(permResult.value)

      auditQueue.push({
        action: 'CREATE_PERMISSION',
        module_name: 'Admin',
        entity_name: 'permission',
        entity_id: perm.id,
        user_id: context?.user?.id || 'system',
        remarks: `Permission created: ${perm.name}`
      })

      return Ok({ id: perm.id, name: perm.name })
    } catch (e: any) {
      return Fail(e.message)
    }
  }
}
