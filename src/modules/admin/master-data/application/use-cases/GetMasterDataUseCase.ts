import { Result } from '@/core/result/Result'
import { IGenericMasterRepository } from '../../domain/IGenericMasterRepository'

export class GetMasterDataUseCase {
  constructor(private readonly repository: IGenericMasterRepository) {}

  async execute(modelName: string): Promise<Result<any[]>> {
    return this.repository.findAll(modelName)
  }
}
