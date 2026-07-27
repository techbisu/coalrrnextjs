import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { IAdminRoleRepository } from '../../domain/repositories/IAdminRoleRepository'
import { auditQueue } from '@/infrastructure/di/Container'

export type UpdatePermissionInput = {
  id: string
  name?: string
  display_name?: string
  module?: string
  group?: string
  description?: string
  actionBy?: string
}

export interface UpdateAdminPermissionResponse {
  id: string
  name: string
}

export class UpdateAdminPermissionUseCase implements IUseCase<UpdatePermissionInput, UpdateAdminPermissionResponse> {
  constructor(private readonly repo: IAdminRoleRepository) {}

  async execute(input: UpdatePermissionInput, context?: any): Promise<Result<UpdateAdminPermissionResponse>> {
    try {
      const perm = await this.repo.findPermissionById(input.id)
      if (!perm) {
        return Fail('Permission not found')
      }

      perm.update({
        name: input.name,
        displayName: input.display_name,
        module: input.module,
        group: input.group,
        description: input.description,
        updtBy: input.actionBy || context?.user?.id || 'system'
      })

      const persistedPerm = await this.repo.updatePermission(perm)

      auditQueue.push({
        action: 'UPDATE_PERMISSION',
        module_name: 'Admin',
        entity_name: 'permission',
        entity_id: persistedPerm.id,
        user_id: context?.user?.id || 'system',
        remarks: `Permission updated: ${persistedPerm.name}`
      })

      return Ok({ id: persistedPerm.id, name: persistedPerm.name })
    } catch (e: any) {
      return Fail(e.message)
    }
  }
}
