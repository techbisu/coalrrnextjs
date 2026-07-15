import { Result } from '@/core/result/Result'
import { IGenericMasterRepository } from '../../domain/IGenericMasterRepository'

export class UpdateMasterDataUseCase {
  constructor(private readonly repository: IGenericMasterRepository) {}

  async execute(modelName: string, pkField: string, id: any, data: any): Promise<Result<any>> {
    return this.repository.update(modelName, pkField, id, data)
  }
}
