import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { IAdminRoleRepository } from '../../domain/repositories/IAdminRoleRepository'
import { auditQueue } from '@/infrastructure/di/Container'

export type UpdateRoleInput = {
  id: string
  name?: string
  display_name?: string
  description?: string
  actionBy?: string
}

export interface UpdateAdminRoleResponse {
  id: string
  name: string
}

export class UpdateAdminRoleUseCase implements IUseCase<UpdateRoleInput, UpdateAdminRoleResponse> {
  constructor(private readonly repo: IAdminRoleRepository) {}

  async execute(input: UpdateRoleInput, context?: any): Promise<Result<UpdateAdminRoleResponse>> {
    try {
      const role = await this.repo.findRoleById(input.id)
      if (!role) {
        return Fail('Role not found')
      }

      role.update({
        name: input.name,
        displayName: input.display_name,
        description: input.description,
        updtBy: input.actionBy || context?.user?.id || 'system'
      })

      const persistedRole = await this.repo.updateRole(role)

      auditQueue.push({
        action: 'UPDATE_ROLE',
        module_name: 'Admin',
        entity_name: 'role',
        entity_id: persistedRole.id,
        user_id: context?.user?.id || 'system',
        remarks: `Role updated: ${persistedRole.name}`
      })

      return Ok({ id: persistedRole.id, name: persistedRole.name })
    } catch (e: any) {
      return Fail(e.message)
    }
  }
}
