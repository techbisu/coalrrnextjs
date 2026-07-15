import { Result } from '@/core/result/Result'
import { IGenericMasterRepository } from '../../domain/IGenericMasterRepository'

export class CreateMasterDataUseCase {
  constructor(private readonly repository: IGenericMasterRepository) {}

  async execute(modelName: string, data: any): Promise<Result<any>> {
    return this.repository.create(modelName, data)
  }
}
