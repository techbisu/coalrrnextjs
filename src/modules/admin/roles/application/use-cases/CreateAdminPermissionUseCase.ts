import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { IAdminRoleRepository } from '../../domain/repositories/IAdminRoleRepository'
import { permission } from '@prisma/client'
import { auditQueue } from '@/infrastructure/di/Container'

type CreatePermissionInput = {
  name: string
  display_name: string
  module?: string
  group?: string
  description?: string
  guard_name?: string
}

export class CreateAdminPermissionUseCase implements IUseCase<CreatePermissionInput, permission> {
  constructor(private readonly repo: IAdminRoleRepository) {}

  async execute(input: CreatePermissionInput, context?: any): Promise<Result<permission>> {
    try {
      const data: Omit<permission, 'id' | 'entry_ts' | 'updt_ts'> = {
        name: input.name,
        display_name: input.display_name,
        guard_name: input.guard_name || 'web',
        module: input.module || null,
        group: input.group || null,
        description: input.description || null,
      }

      const perm = await this.repo.createPermission(data)

      auditQueue.push({
        action: 'CREATE_PERMISSION',
        module_name: 'Admin',
        entity_name: 'permission',
        entity_id: perm.id,
        user_id: context?.user?.id || 'system',
        remarks: `Permission created: ${perm.name}`
      })

      return Ok(perm)
    } catch (e: any) {
      return Fail(e.message)
    }
  }
}
