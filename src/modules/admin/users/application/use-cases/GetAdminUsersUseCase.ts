import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { IAdminUserRepository } from '../../domain/repositories/IAdminUserRepository'
import { user } from '@prisma/client'

export class GetAdminUsersUseCase implements IUseCase<void, user[]> {
  constructor(private readonly repo: IAdminUserRepository) {}

  async execute(): Promise<Result<user[]>> {
    try {
      const users = await this.repo.findAll()
      return Ok(users)
    } catch (e: any) {
      return Fail(e.message)
    }
  }
}
