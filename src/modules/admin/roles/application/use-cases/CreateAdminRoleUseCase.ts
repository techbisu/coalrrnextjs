import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { IAdminRoleRepository } from '../../domain/repositories/IAdminRoleRepository'
import { role } from '@prisma/client'
import { randomUUID } from 'crypto'
import { auditQueue } from '@/infrastructure/di/Container'

type CreateRoleInput = {
  name: string
  display_name: string
  guard_name?: string
  description?: string
  is_system?: boolean
}

export class CreateAdminRoleUseCase implements IUseCase<CreateRoleInput, role> {
  constructor(private readonly repo: IAdminRoleRepository) {}

  async execute(input: CreateRoleInput, context?: any): Promise<Result<role>> {
    try {
      const data: Omit<role, 'id' | 'entry_ts' | 'updt_ts'> = {
        name: input.name,
        display_name: input.display_name,
        guard_name: input.guard_name || 'web',
        description: input.description || null,
        is_system: input.is_system || false
      }

      const role = await this.repo.createRole(data)

      auditQueue.push({
        action: 'CREATE_ROLE',
        module_name: 'Admin',
        entity_name: 'role',
        entity_id: role.id,
        user_id: context?.user?.id || 'system',
        remarks: `Role created: ${role.name}`
      })

      return Ok(role)
    } catch (e: any) {
      return Fail(e.message)
    }
  }
}
