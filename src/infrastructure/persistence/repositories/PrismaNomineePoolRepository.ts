import { db } from '@/lib/db'
import { INomineePoolRepository } from '@/modules/employment/interfaces/INomineePoolRepository'

export class PrismaNomineePoolRepository implements INomineePoolRepository {
  async findAllPools(): Promise<any[]> {
    return db.nominee_pool.findMany({
      include: {
        _count: {
          select: { contributions: true }
        },
        employment_applications: true
      },
      orderBy: { entry_ts: 'desc' }
    })
  }

  async findPoolById(id: string): Promise<any | null> {
    return db.nominee_pool.findUnique({
      where: { id },
      include: {
        contributions: {
          include: {
            form_i_claim: {
              include: { plot: true }
            }
          }
        },
        employment_applications: true
      }
    })
  }
}
