import { db } from '@/lib/db'
import { IPlotRepository, PlotData } from '@/domain/entities/plot/IPlotRepository'

export class PrismaPlotRepository implements IPlotRepository {
  async findById(id: string): Promise<PlotData | null> {
    const plot = await db.mst_plot.findUnique({
      where: { id }
    })

    if (!plot) return null

    return {
      id: plot.id,
      plot_number: plot.plot_number,
      area_acres: plot.area_acres.toString()
    }
  }

  async findAllPlots(where?: any): Promise<any[]> {
    return db.mst_plot.findMany({
      where,
      include: { mouza: true, form_i_claims: true },
      orderBy: [{ mouza: { mouza_en: 'asc' } }, { plot_number: 'asc' }],
    })
  }
}
