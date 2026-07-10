import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { IClaimRepository } from '@/modules/land-acquisition/interfaces/IClaimRepository'

export interface UpdateDraftClaimDTO {
  id: string
  body: {
    claimant_name?: string
    own_share_acres?: string
    opted_monetary_in_lieu_of_employment?: boolean
    bank_account_number?: string
    bank_ifsc?: string
  }
}

export class UpdateDraftClaimUseCase implements IUseCase<UpdateDraftClaimDTO, any> {
  constructor(private claimRepository: IClaimRepository) {}

  async execute(req: UpdateDraftClaimDTO): Promise<Result<any>> {
    try {
      const { id, body } = req
      if (!body) return Fail('Invalid body')

      const claim = await this.claimRepository.findById(id)
      if (!claim) return Fail('Claim not found')
      if (claim.state !== 'Drafting') return Fail(`Cannot edit claim in state ${claim.state}`)

      const updated = await this.claimRepository.update(id, {
        ...(body.claimant_name !== undefined && { claimant_name: body.claimant_name }),
        ...(body.own_share_acres !== undefined && { own_share_acres: body.own_share_acres }),
        ...(body.opted_monetary_in_lieu_of_employment !== undefined && { opted_monetary_in_lieu_of_employment: body.opted_monetary_in_lieu_of_employment }),
        ...(body.bank_account_number !== undefined && { bank_account_number: body.bank_account_number }),
        ...(body.bank_ifsc !== undefined && { bank_ifsc: body.bank_ifsc }),
      })

      return Ok({ id: updated.id, savedAt: new Date().toISOString() })
    } catch (error: any) {
      return Fail(error.message || 'Failed to save claim step')
    }
  }
}
