import { UserScopeService } from "@/core/authorization/services/UserScopeService";
import { db } from '@/lib/db'
import { IClaimRepository } from '@/modules/land-acquisition/interfaces/IClaimRepository'

export class PrismaClaimRepository implements IClaimRepository {
  async findAll(): Promise<any[]> {
    return db.form_i_claim.findMany({
      include: { plot: { include: { mouza: true } } },
      orderBy: { entry_ts: 'desc' },
    })
  }

  async findById(id: string): Promise<any | null> {
    return db.form_i_claim.findUnique({
      where: { id },
    })
  }

  async findByCitizenAndPlot(citizen_id_hash: string, plot_id: string): Promise<any | null> {
    return db.form_i_claim.findUnique({
      where: { citizen_id_hash_plot_id: { citizen_id_hash, plot_id } },
    })
  }

  async create(data: any): Promise<any> {
    return db.form_i_claim.create({
      data,
    })
  }

  async update(id: string, data: any): Promise<any> {
    return db.form_i_claim.update({
      where: { id },
      data,
    })
  }
}
