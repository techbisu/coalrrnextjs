import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result } from '@/core/result/Result'
import { IPafRepository, PafRecordDetails } from '@/modules/paf/interfaces/IPafRepository'

export interface CreatePafRecordRequest {
  claimant_name?: string
  category_of_entitlement?: string
  sc_st_obc_category?: string
  plot_id?: string
}

export class CreatePafRecordUseCase implements IUseCase<CreatePafRecordRequest, PafRecordDetails> {
  constructor(private readonly pafRepository: IPafRepository) {}

  async execute(request: CreatePafRecordRequest): Promise<Result<PafRecordDetails>> {
    try {
      if (!request.claimant_name || !request.category_of_entitlement) {
        return Result.fail('claimant_name and category_of_entitlement are required')
      }

      const count = await this.pafRepository.count()
      const paf_id = `PAF-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`

      const record = await this.pafRepository.create({
        paf_id,
        claimant_name: request.claimant_name,
        category_of_entitlement: request.category_of_entitlement,
        sc_st_obc_category: request.sc_st_obc_category,
        plot_id: request.plot_id ?? null,
      })

      return Result.ok(record)
    } catch (error) {
      return Result.fail(error instanceof Error ? error.message : String(error))
    }
  }
}
