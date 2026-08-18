import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { IClaimRepository } from '@/modules/land-acquisition/interfaces/IClaimRepository'

export interface UpdateDraftClaimDTO {
  id: string
  body: Record<string, any>
}

export class UpdateDraftClaimUseCase implements IUseCase<UpdateDraftClaimDTO, any> {
  constructor(private claimRepository: IClaimRepository) {}

  async execute(req: UpdateDraftClaimDTO): Promise<Result<any>> {
    try {
      const { id, body } = req
      if (!body) return Fail('Invalid body')

      const claim = await this.claimRepository.findById(id)
      if (!claim) return Fail('Claim not found')

      const updated = await this.claimRepository.update(id, body)

      return Ok({ id: updated.id, savedAt: new Date().toISOString() })
    } catch (error: any) {
      return Fail(error.message || 'Failed to save claim step')
    }
  }
}
