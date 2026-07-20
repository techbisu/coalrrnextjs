import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { IAdminRoleRepository } from '../../domain/repositories/IAdminRoleRepository'
import { auditQueue } from '@/infrastructure/di/Container'

export class DeleteAdminRoleUseCase implements IUseCase<string, void> {
  constructor(private readonly repo: IAdminRoleRepository) {}

  async execute(id: string, context?: any): Promise<Result<void>> {
    try {
      await this.repo.deleteRole(id)

      auditQueue.push({
        action: 'DELETE_ROLE',
        module_name: 'Admin',
        entity_name: 'role',
        entity_id: id,
        user_id: context?.user?.id || 'system',
        remarks: `Role deleted`
      })

      return Ok(undefined)
    } catch (e: any) {
      return Fail(e.message)
    }
  }
}
