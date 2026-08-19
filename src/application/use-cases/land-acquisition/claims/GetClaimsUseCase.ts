import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { IClaimRepository } from '@/modules/land-acquisition/interfaces/IClaimRepository'
import { dec, iso } from '@/app/api/_lib'
import { db } from '@/lib/db'
import { getDisplayPlotNo } from '@/shared/utils/plot.utils'

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
        const decls = Array.isArray(c.statutory_declarations) ? (c.statutory_declarations as any[]) : []
        const getDecl = (qNo: number) => decls.find((d: any) => d.q_no === qNo)

        const rawPlots: any[] = Array.isArray(c.form_i_claim_plot) && c.form_i_claim_plot.length > 0
          ? c.form_i_claim_plot
          : (Array.isArray(c.plots) && c.plots.length > 0 ? c.plots : [])

        const mappedPlots = rawPlots.map((cp: any) => {
          const plotInfo = plotMap.get(String(cp.plot_schedule_id))
          const rawNo = cp.plot_no || plotInfo?.plot_no || plotInfo?.plot_number || cp.plot_schedule_id
          const cleanPlotNo = getDisplayPlotNo(rawNo, plotInfo?.state_lgd, plotInfo?.mouza_lgd || plotInfo?.mouza?.mouza_lgd, plotInfo?.plot_ty)
          const shareVal = Number(cp.own_share_acres ?? cp.share_acres ?? 0)
          return {
            id: cp.id,
            plot_schedule_id: cp.plot_schedule_id,
            plot_no: rawNo,
            display_plot_no: cleanPlotNo,
            khatian_no: cp.khatian_no || '-',
            own_share_acres: shareVal,
            total_ror_area: Number(cp.total_ror_area ?? 0),
            mouza: plotInfo?.mouza?.mouza_en || (plotInfo?.jl_no ? `JL-${plotInfo.jl_no} Mouza` : "MADHAIPUR"),
            land_type: plotInfo?.plot_ty === '1' || plotInfo?.plot_ty === 'LR' ? 'Agricultural' : (plotInfo?.plot_ty || "Agricultural"),
          }
        })

        // Resolve primary fallback plot schedule
        const primarySchedId = mappedPlots[0]?.plot_schedule_id || c.plot_id
        const p = primarySchedId ? plotMap.get(String(primarySchedId)) : null

        // Display string for plot numbers
        let formattedPlotNumber = ''
        if (mappedPlots.length > 0) {
          formattedPlotNumber = mappedPlots.map(mp => mp.display_plot_no).join(', ')
        } else if (p) {
          formattedPlotNumber = getDisplayPlotNo(p.plot_no || p.plot_number || `Plot #${p.schedule_id}`, p.state_lgd, p.mouza_lgd || p.mouza?.mouza_lgd, p.plot_ty)
        } else if (c.plot_id) {
          formattedPlotNumber = `Plot #${c.plot_id}`
        } else {
          formattedPlotNumber = '—'
        }

        // Sum share acres across plots or fallback to claim level
        let totalShareAcres = 0
        if (mappedPlots.length > 0) {
          totalShareAcres = mappedPlots.reduce((acc, mp) => acc + (Number(mp.own_share_acres) || 0), 0)
        } else {
          totalShareAcres = Number(dec(c.own_share_acres) ?? 0)
        }

        // Resolve mouza name
        const mouzaName = mappedPlots[0]?.mouza || p?.mouza?.mouza_en || (p?.jl_no ? `JL-${p.jl_no} Mouza` : "MADHAIPUR")

        // Resolve khatian nos
        const khatianNoStr = mappedPlots.length > 0
          ? Array.from(new Set(mappedPlots.map(mp => mp.khatian_no).filter((k: string) => k && k !== '-'))).join(', ') || c.khatian_no || '-'
          : (c.khatian_no || '-')

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
          photo_doc_id: c.photo_doc_id,
          bank_name: c.bank_name,
          bank_branch: c.bank_branch,
          bank_account_number: c.bank_account_number,
          bank_ifsc: c.bank_ifsc,
          passbook_doc_id: c.passbook_doc_id,
          magistrate_affidavit_doc_id: c.magistrate_affidavit_doc_id,
          title_deed_doc_id: c.title_deed_doc_id,
          plot_id: primarySchedId,
          plot_number: formattedPlotNumber,
          mouza: mouzaName,
          state_lgd: String(p?.state_lgd || c.state_lgd || '19'),
          district_lgd: String(p?.district_lgd || c.district_lgd || '704'),
          block_lgd: String(p?.block_lgd || c.block_lgd || '2802'),
          mouza_lgd: String(p?.mouza_lgd || p?.mouza?.mouza_lgd || c.mouza_lgd || '2802004'),
          pincode: c.pincode || '713363',
          land_type: p?.plot_ty || "Agricultural",
          own_share_acres: totalShareAcres,
          khatian_no: khatianNoStr,
          plots: mappedPlots,
          form_i_claim_plot: mappedPlots,
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
