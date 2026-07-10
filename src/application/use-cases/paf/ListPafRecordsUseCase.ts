import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result } from '@/core/result/Result'
import { IPafRepository, PafRecordDetails } from '@/modules/paf/interfaces/IPafRepository'

export interface ListPafRecordsRequest {
  category_of_entitlement?: string
  sc_st_obc_category?: string
}

export class ListPafRecordsUseCase implements IUseCase<ListPafRecordsRequest, PafRecordDetails[]> {
  constructor(private readonly pafRepository: IPafRepository) {}

  async execute(request: ListPafRecordsRequest): Promise<Result<PafRecordDetails[]>> {
    try {
      const records = await this.pafRepository.findMany(request)
      return Result.ok(records)
    } catch (error) {
      return Result.fail(error instanceof Error ? error.message : String(error))
    }
  }
}
