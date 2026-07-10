import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result } from '@/core/result/Result'
import { IPafRepository } from '@/modules/paf/interfaces/IPafRepository'

export interface DeletePafRecordRequest {
  id: string
}

export class DeletePafRecordUseCase implements IUseCase<DeletePafRecordRequest, { deleted: boolean }> {
  constructor(private readonly pafRepository: IPafRepository) {}

  async execute(request: DeletePafRecordRequest): Promise<Result<{ deleted: boolean }>> {
    try {
      await this.pafRepository.delete(String(BigInt(request.id)))
      return Result.ok({ deleted: true })
    } catch (error) {
      return Result.fail(error instanceof Error ? error.message : String(error))
    }
  }
}
