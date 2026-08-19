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
        const decls = Array.isArray(c.statutory_declarations) ? (c.statutory_declarations as any[]) : []
        const getDecl = (qNo: number) => decls.find((d: any) => d.q_no === qNo)

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
          photo_doc_id: c.photo_doc_id,
          bank_name: c.bank_name,
          bank_branch: c.bank_branch,
          bank_account_number: c.bank_account_number,
          bank_ifsc: c.bank_ifsc,
          passbook_doc_id: c.passbook_doc_id,
          magistrate_affidavit_doc_id: c.magistrate_affidavit_doc_id,
          title_deed_doc_id: c.title_deed_doc_id,
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
          statutory_declarations: decls,
          plot_entries: c.plot_entries || [],
          prior_compensation_received: getDecl(9)?.answer_boolean ?? false,
          prior_compensation_details: getDecl(9)?.details || undefined,
          prior_employment_linked: getDecl(11)?.answer_boolean ?? false,
          prior_employment_details: getDecl(11)?.details || undefined,
          is_free_from_disputes: getDecl(12)?.answer_boolean ?? true,
          dispute_details: getDecl(12)?.details || undefined,
          is_free_from_encumbrances: getDecl(13)?.answer_boolean ?? true,
          encumbrance_details: getDecl(13)?.details || undefined,
          can_handover_possession: getDecl(14)?.answer_boolean ?? true,
          possession_reason: getDecl(14)?.details || undefined,
          opted_monetary_in_lieu_of_employment: getDecl(15)?.answer_boolean ?? false,
          monetary_opt_reason: getDecl(15)?.details || undefined,
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
