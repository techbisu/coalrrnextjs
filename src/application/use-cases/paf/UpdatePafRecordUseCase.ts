import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result } from '@/core/result/Result'
import { IPafRepository, PafRecordDetails } from '@/modules/paf/interfaces/IPafRepository'

export interface UpdatePafRecordRequest {
  id: string
  claimant_name?: unknown
  category_of_entitlement?: unknown
  sc_st_obc_category?: unknown
  plot_id?: unknown
  photo_identity_card_doc?: unknown
}

export class UpdatePafRecordUseCase implements IUseCase<UpdatePafRecordRequest, PafRecordDetails> {
  constructor(private readonly pafRepository: IPafRepository) {}

  async execute(request: UpdatePafRecordRequest): Promise<Result<PafRecordDetails>> {
    try {
      const updateDto: Record<string, string | null> = {}
      if (request.claimant_name) updateDto.claimant_name = String(request.claimant_name)
      if (request.category_of_entitlement) updateDto.category_of_entitlement = String(request.category_of_entitlement)
      if (request.sc_st_obc_category !== undefined) updateDto.sc_st_obc_category = request.sc_st_obc_category ? String(request.sc_st_obc_category) : null
      if (request.plot_id !== undefined) updateDto.plot_id = request.plot_id ? String(request.plot_id) : null
      if (request.photo_identity_card_doc !== undefined) updateDto.photo_identity_card_doc = request.photo_identity_card_doc ? String(request.photo_identity_card_doc) : null

      const record = await this.pafRepository.update(String(request.id), updateDto as any)

      return Result.ok(record)
    } catch (error) {
      return Result.fail(error instanceof Error ? error.message : String(error))
    }
  }
}
