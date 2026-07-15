import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { ISystemConfigRepository } from '../../domain/repositories/ISystemConfigRepository'

interface ConfigDTO {
  id: string
  category: string
  key: string
  value: string
  type: string
  description: string | null
  is_secret: boolean
}

export class GetSystemConfigsUseCase implements IUseCase<void, ConfigDTO[]> {
  constructor(private readonly repo: ISystemConfigRepository) {}

  async execute(): Promise<Result<ConfigDTO[]>> {
    try {
      const configs = await this.repo.findAll()
      const dtos = configs.map(c => ({
        id: c.id,
        category: c.category,
        key: c.key,
        value: c.is_secret ? '********' : c.value,
        type: c.type,
        description: c.description,
        is_secret: c.is_secret
      }))
      return Ok(dtos)
    } catch (e: any) {
      return Fail(e.message)
    }
  }
}
