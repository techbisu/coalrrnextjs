import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { IAdminRoleRepository } from '../../domain/repositories/IAdminRoleRepository'
import { AdminRole, CreateAdminRoleProps } from '../../domain/entities/AdminRole'
import { auditQueue } from '@/infrastructure/di/Container'

export type CreateRoleInput = {
  name: string
  display_name: string
  description?: string
  actionBy?: string
}

export interface CreateAdminRoleResponse {
  id: string
  name: string
}

export class CreateAdminRoleUseCase implements IUseCase<CreateRoleInput, CreateAdminRoleResponse> {
  constructor(private readonly repo: IAdminRoleRepository) {}

  async execute(input: CreateRoleInput, context?: any): Promise<Result<CreateAdminRoleResponse>> {
    const roleResult = AdminRole.create({
      name: input.name,
      displayName: input.display_name,
      description: input.description,
      actionBy: input.actionBy || context?.user?.id || 'system'
    })

    if (roleResult.isFailure) {
      return Fail(String(roleResult.error))
    }

    const domainRole = roleResult.value

    try {
      const persistedRole = await this.repo.createRole(domainRole)

      auditQueue.push({
        action: 'CREATE_ROLE',
        module_name: 'Admin',
        entity_name: 'role',
        entity_id: persistedRole.id,
        user_id: context?.user?.id || 'system',
        remarks: `Role created: ${persistedRole.name}`
      })

      return Ok({ id: persistedRole.id, name: persistedRole.name })
    } catch (e: any) {
      return Fail(e.message)
    }
  }
}
