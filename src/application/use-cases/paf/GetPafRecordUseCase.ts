import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result } from '@/core/result/Result'
import { IPafRepository, PafRecordDetails } from '@/modules/paf/interfaces/IPafRepository'

export interface GetPafRecordRequest {
  id: string
}

export class GetPafRecordUseCase implements IUseCase<GetPafRecordRequest, PafRecordDetails> {
  constructor(private readonly pafRepository: IPafRepository) {}

  async execute(request: GetPafRecordRequest): Promise<Result<PafRecordDetails>> {
    try {
      const record = await this.pafRepository.findById(String(String(BigInt(request.id))))
      
      if (!record) {
        return Result.fail('PAF record not found')
      }

      return Result.ok(record)
    } catch (error) {
      return Result.fail(error instanceof Error ? error.message : String(error))
    }
  }
}
