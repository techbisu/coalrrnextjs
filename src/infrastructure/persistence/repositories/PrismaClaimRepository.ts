import { UserScopeService } from "@/core/authorization/services/UserScopeService";
import { db } from '@/lib/db'
import { IClaimRepository } from '@/modules/land-acquisition/interfaces/IClaimRepository'
import { randomUUID } from 'crypto'

export class PrismaClaimRepository implements IClaimRepository {
  async findAll(): Promise<any[]> {
    return db.form_i_claim.findMany({
      include: { nominee_pool_contribution: true, form_i_claim_plot: true },
      orderBy: { entry_ts: 'desc' },
    })
  }

  async findById(id: string): Promise<any | null> {
    const claim = await db.form_i_claim.findUnique({
      where: { id },
      include: { form_i_claim_plot: true },
    })
    if (!claim) return null
    const land_loser_master = await db.land_loser_master.findUnique({
      where: { citizen_id_hash: claim.citizen_id_hash }
    })
    return { ...claim, land_loser_master }
  }

  async findByCitizenAndPlot(citizen_id_hash: string, plot_id: string): Promise<any | null> {
    return db.form_i_claim.findFirst({
      where: {
        citizen_id_hash,
        form_i_claim_plot: {
          some: {
            OR: [
              { plot_schedule_id: plot_id },
              { plot_no: plot_id },
            ]
          }
        }
      },
      include: { form_i_claim_plot: true },
    })
  }

  async create(data: any): Promise<any> {
    const { plots, ...claimData } = data
    const payload = {
      ...claimData,
      id: (claimData.id && String(claimData.id).trim()) || randomUUID(),
      ...(plots && Array.isArray(plots) && plots.length > 0 ? {
        form_i_claim_plot: {
          create: plots.map((p: any) => ({
            id: randomUUID(),
            plot_schedule_id: p.plot_schedule_id || p.plot_id || null,
            plot_no: p.plot_no || p.plot_id || null,
            khatian_no: p.khatian_no || null,
            own_share_acres: p.own_share_acres ? String(p.own_share_acres) : '0.0000',
            total_ror_area: p.total_ror_area ? String(p.total_ror_area) : null,
            link_deed_no: p.link_deed_no || null,
            ownership_date: p.ownership_date ? new Date(p.ownership_date) : null,
            transferor_name: p.transferor_name || null,
            acquisition_mode_offered: p.acquisition_mode_offered || 'CBA_ACT',
          }))
        }
      } : {})
    }
    return db.form_i_claim.create({
      data: payload,
      include: { form_i_claim_plot: true },
    })
  }

  async update(id: string, data: any): Promise<any> {
    const {
      plots,
      plot_entries,
      form_i_claim_plot,
      authType,
      aadhaarNumber,
      same_as_present,
      certified_accurate,
      total_claim_share_acres,
      prior_compensation_received,
      prior_compensation_details,
      prior_employment_linked,
      prior_employment_details,
      is_free_from_disputes,
      dispute_details,
      is_free_from_encumbrances,
      encumbrance_details,
      can_handover_possession,
      possession_reason,
      possession_handover_reasons,
      opted_monetary_in_lieu_of_employment,
      monetary_opt_reason,
      plot_id,
      khatian_no,
      own_share_acres,
      state_lgd,
      district_lgd,
      block_lgd,
      mouza_lgd,
      pincode,
      daysRemaining,
      display_plot_no,
      primary_mobile_no,
      ...validClaimData
    } = data

    const plotList = plots || plot_entries || form_i_claim_plot || []

    if (Array.isArray(plotList) && plotList.length > 0) {
      await db.form_i_claim_plot.deleteMany({ where: { form_i_claim_id: id } })
      await db.form_i_claim_plot.createMany({
        data: plotList.map((p: any) => ({
          id: randomUUID(),
          form_i_claim_id: id,
          plot_schedule_id: p.plot_schedule_id || p.plot_id || null,
          plot_no: p.plot_no || p.plot_id || null,
          khatian_no: p.khatian_no || null,
          own_share_acres: p.own_share_acres ? String(p.own_share_acres) : '0.0000',
          total_ror_area: p.total_ror_area ? String(p.total_ror_area) : null,
          link_deed_no: p.link_deed_no || null,
          ownership_date: p.ownership_date ? new Date(p.ownership_date) : null,
          transferor_name: p.transferor_name || null,
          acquisition_mode_offered: p.acquisition_mode_offered || 'CBA_ACT',
        }))
      })
    }

    const statutory_declarations = [
      {
        q_no: 9,
        answer_boolean: !!prior_compensation_received,
        details: prior_compensation_details || null,
        question: "If any compensation has been received earlier for these plots of lands from ECL or any other Authority by him/her or his/her family? If so, give details:"
      },
      {
        q_no: 11,
        answer_boolean: !!prior_employment_linked,
        details: prior_employment_details || null,
        question: "If any part of these plots was included in another employment in ECL? If so, give details:"
      },
      {
        q_no: 12,
        answer_boolean: is_free_from_disputes ?? true,
        details: dispute_details || null,
        question: "Whether these plots/lands are presently free from any disputes or court case with the co-shares, bargadar or adjacent landowners? If not so, give detail:"
      },
      {
        q_no: 13,
        answer_boolean: is_free_from_encumbrances ?? true,
        details: encumbrance_details || null,
        question: "Whether these plots/lands are presently free from any encumbrances? If not, give details:"
      },
      {
        q_no: 14,
        answer_boolean: can_handover_possession ?? true,
        details: possession_reason || possession_handover_reasons || null,
        question: "Whether he/she has able to handover peaceful and encumbrance-free possession of above lands to the ECL? If not, give reasons:"
      },
      {
        q_no: 15,
        answer_boolean: !!opted_monetary_in_lieu_of_employment,
        details: monetary_opt_reason || null,
        question: "Has he/she agreed to accept 'One time Monetary compensation of CIL R&R Policy / One Time lumpsum / modified annuity scheme of ECL in lieu of employment' against above land? If not, give reason:"
      }
    ]

    const updatePayload: Record<string, any> = {
      ...validClaimData,
      statutory_declarations,
      updt_by: 'system',
      updt_ts: new Date(),
    }

    delete updatePayload.plots
    delete updatePayload.plot_entries
    delete updatePayload.form_i_claim_plot

    return db.form_i_claim.update({
      where: { id },
      data: updatePayload,
      include: { form_i_claim_plot: true },
    })
  }
}
