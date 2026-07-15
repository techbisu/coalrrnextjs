import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { IAdminRoleRepository } from '../../domain/repositories/IAdminRoleRepository'
import { role } from '@prisma/client'

export class GetAdminRolesUseCase implements IUseCase<void, role[]> {
  constructor(private readonly repo: IAdminRoleRepository) {}

  async execute(): Promise<Result<role[]>> {
    try {
      const roles = await this.repo.findAllRoles()
      return Ok(roles)
    } catch (e: any) {
      return Fail(e.message)
    }
  }
}
