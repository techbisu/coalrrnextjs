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
    const { plots, ...claimData } = data
    if (plots && Array.isArray(plots) && plots.length > 0) {
      await db.form_i_claim_plot.deleteMany({ where: { form_i_claim_id: id } })
      await db.form_i_claim_plot.createMany({
        data: plots.map((p: any) => ({
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
    return db.form_i_claim.update({
      where: { id },
      data: claimData,
      include: { form_i_claim_plot: true },
    })
  }
}
