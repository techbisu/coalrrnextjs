import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { IAdminRoleRepository } from '../../domain/repositories/IAdminRoleRepository'
import { permission } from '@prisma/client'

export class GetAdminPermissionsUseCase implements IUseCase<void, permission[]> {
  constructor(private readonly repo: IAdminRoleRepository) {}

  async execute(): Promise<Result<permission[]>> {
    try {
      const perms = await this.repo.findAllPermissions()
      return Ok(perms)
    } catch (e: any) {
      return Fail(e.message)
    }
  }
}
