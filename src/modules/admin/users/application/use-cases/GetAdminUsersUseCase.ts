import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { IAdminUserRepository } from '../../domain/repositories/IAdminUserRepository'
import { AdminUser } from '../../domain/entities/AdminUser'

export class GetAdminUsersUseCase implements IUseCase<void, any[]> {
  constructor(private readonly repo: IAdminUserRepository) {}

  async execute(): Promise<Result<any[]>> {
    try {
      const users = await this.repo.findAll()
      // Map domain entities to DTOs for the API response
      const dtos = users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        portal: user.portal,
        designation: user.designation,
        mine_cd: user.mineCd,
        is_active: user.isActive
      }))
      return Ok(dtos)
    } catch (e: any) {
      return Fail(e.message)
    }
  }
}
