import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { IAdminRoleRepository } from '../../domain/repositories/IAdminRoleRepository'
import { AdminRole } from '../../domain/entities/AdminRole'

export class GetAdminRolesUseCase implements IUseCase<void, any[]> {
  constructor(private readonly repo: IAdminRoleRepository) {}

  async execute(): Promise<Result<any[]>> {
    try {
      const roles = await this.repo.findAllRoles()
      const dtos = roles.map(role => ({
        id: role.id,
        name: role.name,
        display_name: role.displayName,
        description: role.description,
        guard_name: role.guardName,
        is_system: role.isSystem,
        entry_ts: (role as any)._entryTs,
        updt_ts: (role as any)._updtTs
      }))
      return Ok(dtos)
    } catch (e: any) {
      return Fail(e.message)
    }
  }
}
