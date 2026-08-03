import { db } from '@/lib/db'
import { IPlotRepository, PlotData } from '@/domain/entities/plot/IPlotRepository'

export class PrismaPlotRepository implements IPlotRepository {
  async findById(id: string): Promise<PlotData | null> {
    const plot = await db.plot_schedule.findFirst({
      where: { plot_no: id }
    })

    if (!plot) return null

    return {
      id: plot.plot_no,
      plot_number: plot.plot_number || plot.plot_no,
      area_acres: '0' // plot_schedule doesn't have area_acres directly mapped here
    }
  }

  async findAllPlots(where?: any): Promise<any[]> {
    return db.plot_schedule.findMany({
      where,
      orderBy: [{ plot_no: 'asc' }],
    })
  }
}
