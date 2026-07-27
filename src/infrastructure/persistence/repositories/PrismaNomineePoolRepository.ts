import { db } from '@/lib/db'
import { INomineePoolRepository } from '@/modules/employment/interfaces/INomineePoolRepository'

export class PrismaNomineePoolRepository implements INomineePoolRepository {
  async findAllPools(): Promise<any[]> {
    return db.nominee_pool.findMany({
      include: {
        _count: {
          select: { nominee_pool_contribution: true }
        },
        employment_application: true
      },
      orderBy: { entry_ts: 'desc' }
    })
  }

  async findPoolById(id: string): Promise<any | null> {
    return db.nominee_pool.findUnique({
      where: { id },
      include: {
        nominee_pool_contribution: {
          include: {
            form_i_claim: {
              include: { mst_plot: true }
            }
          }
        },
        employment_application: true
      }
    })
  }
}
