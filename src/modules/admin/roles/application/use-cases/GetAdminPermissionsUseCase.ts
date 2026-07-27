import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { IAdminRoleRepository } from '../../domain/repositories/IAdminRoleRepository'
import { AdminPermission } from '../../domain/entities/AdminPermission'

export class GetAdminPermissionsUseCase implements IUseCase<void, any[]> {
  constructor(private readonly repo: IAdminRoleRepository) {}

  async execute(): Promise<Result<any[]>> {
    try {
      const perms = await this.repo.findAllPermissions()
      const dtos = perms.map(p => ({
        id: p.id,
        name: p.name,
        display_name: p.displayName,
        description: p.description,
        module: p.module,
        group: p.group,
        guard_name: p.guardName,
        entry_ts: (p as any)._entryTs,
        updt_ts: (p as any)._updtTs
      }))
      return Ok(dtos)
    } catch (e: any) {
      return Fail(e.message)
    }
  }
}
