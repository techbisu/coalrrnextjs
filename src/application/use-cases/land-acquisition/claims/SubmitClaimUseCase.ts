import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { IClaimRepository } from '@/modules/land-acquisition/interfaces/IClaimRepository'
import { IPlotRepository } from '@/domain/entities/plot/IPlotRepository'
import { createHash } from 'crypto'

export interface SubmitClaimDTO {
  aadhaarNumber?: string
  claimant_name?: string
  plot_id?: string
  own_share_acres?: string
  opted_monetary_in_lieu_of_employment?: boolean
  bank_account_number?: string
  bank_ifsc?: string
}

export class SubmitClaimUseCase implements IUseCase<SubmitClaimDTO, any> {
  constructor(
    private claimRepository: IClaimRepository,
    private plotRepository: IPlotRepository
  ) {}

  async execute(req: SubmitClaimDTO): Promise<Result<any>> {
    try {
      if (!req.aadhaarNumber || !req.claimant_name || !req.plot_id || !req.own_share_acres) {
        return Fail('aadhaarNumber, claimant_name, plot_id, own_share_acres required')
      }

      const plot = await this.plotRepository.findById(req.plot_id)
      if (!plot) return Fail('Plot not found')

      if (Number(req.own_share_acres) <= 0) return Fail('Own share must be > 0')
      if (Number(req.own_share_acres) > Number(plot.area_acres)) {
        return Fail(`Own share ${req.own_share_acres} exceeds plot area ${plot.area_acres}`)
      }

      const citizen_id_hash = createHash('sha256').update(req.aadhaarNumber).digest('hex').slice(0, 16)

      const existing = await this.claimRepository.findByCitizenAndPlot(citizen_id_hash, req.plot_id)
      if (existing) return Fail('Claim already exists for this citizen on this plot')

      const claim_code = `FORM1-${new Date().getFullYear()}-${String(Math.floor(1 + Math.random() * 9999)).padStart(4, '0')}`
      const submitted_at = new Date()
      const transparency_window_ends_at = new Date(submitted_at.getTime() + 21 * 86400000)

      const claim = await this.claimRepository.create({
        claim_code,
        plot_id: req.plot_id,
        citizen_id_hash,
        claimant_name: req.claimant_name,
        own_share_acres: req.own_share_acres,
        opted_monetary_in_lieu_of_employment: req.opted_monetary_in_lieu_of_employment ?? false,
        bank_account_number: req.bank_account_number,
        bank_ifsc: req.bank_ifsc,
        state: 'TitleScrutiny',
        submitted_at,
        transparency_window_ends_at,
      })

      return Ok({
        id: claim.id,
        claim_code: claim.claim_code,
        state: claim.state,
        submitted_at: claim.submitted_at!.toISOString(),
        transparency_window_ends_at: claim.transparency_window_ends_at!.toISOString(),
      })
    } catch (error: any) {
      return Fail(error.message || 'Failed to submit claim')
    }
  }
}
