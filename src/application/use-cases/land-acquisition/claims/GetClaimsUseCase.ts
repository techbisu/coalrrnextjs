import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { IClaimRepository } from '@/modules/land-acquisition/interfaces/IClaimRepository'
import { dec, iso } from '@/app/api/_lib'
import { db } from '@/lib/db'

export class GetClaimsUseCase implements IUseCase<void, any[]> {
  constructor(private claimRepository: IClaimRepository) {}

  async execute(): Promise<Result<any[]>> {
    try {
      const claims = await this.claimRepository.findAll()
      const plots = await db.plot_schedule.findMany({
        include: { mouza: true },
      })
      const plotMap = new Map(plots.map((p) => [String(p.schedule_id), p]))

      const now = Date.now()

      const result = claims.map((c) => {
        const p = plotMap.get(String(c.plot_id)) || plotMap.get(c.plot_id)
        const twEnds = c.transparency_window_ends_at
          ? new Date(c.transparency_window_ends_at).getTime()
          : null
        const daysRemaining = twEnds ? Math.ceil((twEnds - now) / 86400000) : null

        return {
          id: c.id,
          claim_code: c.claim_code,
          claimant_name: c.claimant_name,
          father_husband_name: c.father_husband_name,
          present_address: c.present_address,
          permanent_address: c.permanent_address,
          epic_no: c.epic_no,
          citizen_id_hash: c.citizen_id_hash,
          occupation: c.occupation,
          gender: c.gender,
          nationality: c.nationality,
          religion: c.religion,
          caste_category: c.caste_category,
          plot_id: c.plot_id,
          plot_number: p
            ? p.plot_no || p.plot_number || `Plot #${p.schedule_id}`
            : `Plot #${c.plot_id}`,
          mouza:
            p?.mouza?.mouza_en ||
            (p?.jl_no ? `JL-${p.jl_no} Mouza` : "Approved Mouza"),
          land_type: p?.plot_ty || "Agricultural",
          own_share_acres: dec(c.own_share_acres),
          khatian_no: c.khatian_no,
          link_deed_no: c.link_deed_no,
          ownership_date: iso(c.ownership_date),
          transferor_name: c.transferor_name,
          acquisition_mode_offered: c.acquisition_mode_offered,
          opted_monetary_in_lieu_of_employment:
            c.opted_monetary_in_lieu_of_employment ?? false,
          bank_name: c.bank_name,
          bank_branch: c.bank_branch,
          bank_account_number: c.bank_account_number,
          bank_ifsc: c.bank_ifsc,
          prior_compensation_received: c.prior_compensation_received ?? false,
          prior_compensation_details: c.prior_compensation_details,
          prior_employment_linked: c.prior_employment_linked ?? false,
          prior_employment_details: c.prior_employment_details,
          is_free_from_disputes: c.is_free_from_disputes ?? true,
          dispute_details: c.dispute_details,
          is_free_from_encumbrances: c.is_free_from_encumbrances ?? true,
          can_handover_possession: c.can_handover_possession ?? true,
          form_v_eligible: c.form_v_eligible ?? false,
          state: c.state,
          submitted_at: iso(c.submitted_at),
          transparency_window_ends_at: iso(c.transparency_window_ends_at),
          daysRemaining,
          entry_ts: c.entry_ts
            ? new Date(c.entry_ts).toISOString()
            : new Date().toISOString(),
        }
      })

      return Ok(result)
    } catch (error: any) {
      return Fail(error.message || 'Failed to load claims')
    }
  }
}
