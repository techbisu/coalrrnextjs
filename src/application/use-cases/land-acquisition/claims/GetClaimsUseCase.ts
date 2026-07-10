import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { IClaimRepository } from '@/modules/land-acquisition/interfaces/IClaimRepository'
import { dec, iso } from '@/app/api/_lib'

export class GetClaimsUseCase implements IUseCase<void, any[]> {
  constructor(private claimRepository: IClaimRepository) {}

  async execute(): Promise<Result<any[]>> {
    try {
      const claims = await this.claimRepository.findAll()
      const now = Date.now()

      const result = claims.map((c) => {
        const twEnds = c.transparency_window_ends_at ? c.transparency_window_ends_at.getTime() : null
        const daysRemaining = twEnds ? Math.ceil((twEnds - now) / 86400000) : null
        return {
          id: c.id,
          claim_code: c.claim_code,
          claimant_name: c.claimant_name,
          plot_id: c.plot_id,
          plot_number: c.plot.plot_number,
          mouza: c.plot.mouza.name,
          land_type: c.plot.land_type,
          own_share_acres: dec(c.own_share_acres),
          opted_monetary_in_lieu_of_employment: c.opted_monetary_in_lieu_of_employment,
          state: c.state,
          submitted_at: iso(c.submitted_at),
          transparency_window_ends_at: iso(c.transparency_window_ends_at),
          daysRemaining,
          entry_ts: c.entry_ts.toISOString(),
        }
      })

      return Ok(result)
    } catch (error: any) {
      return Fail(error.message || 'Failed to load claims')
    }
  }
}
