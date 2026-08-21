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

  async countByProposalId(proposalId: string): Promise<number> {
    if (!proposalId) return 0;

    // Is it a valid UUID format?
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(proposalId);
    let resolvedUuid = isUuid ? proposalId : null;

    if (!resolvedUuid) {
      // Find the UUID proposal_id from acq_proposal using proposal_no or ID
      const prop = await db.acq_proposal.findFirst({
        where: { OR: [{ proposal_no: proposalId }, { proposal_id: proposalId }] },
        select: { proposal_id: true }
      }).catch(() => null);

      if (prop?.proposal_id) {
        resolvedUuid = prop.proposal_id;
      }
    }

    if (!resolvedUuid) return 0;

    return db.plot_schedule.count({
      where: {
        proposal_id: resolvedUuid,
        OR: [{ del_ts: null }, { del_ts: 0 }],
      },
    }).catch(async () => {
      // Fallback without del_ts filter
      return db.plot_schedule.count({
        where: { proposal_id: resolvedUuid },
      }).catch(() => 0);
    });
  }
}
