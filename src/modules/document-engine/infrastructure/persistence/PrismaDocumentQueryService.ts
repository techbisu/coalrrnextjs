import { IDocumentQueryService } from '../../application/queries/IDocumentQueryService'
import { db } from '@/lib/db'

export class PrismaDocumentQueryService implements IDocumentQueryService {
  async getProposal(proposalId: string, includeRelations = true): Promise<any> {
    return await db.acq_proposal.findUnique({
      where: { proposal_id: proposalId },
      include: includeRelations ? {
        acqu_mode: true,
        mine_master: true,
        area_master: true,
        plot_schedule: {
          include: { mouza_master: true },
          orderBy: { schedule_id: 'asc' }
        }
      } : undefined
    })
  }

  async getProposalByProjectOrNumber(applicationId: string, includeRelations = true): Promise<any> {
    return await db.acq_proposal.findFirst({
      where: { OR: [{ proposal_no: applicationId }, { proj_cd: applicationId }] },
      include: includeRelations ? {
        mine_master: true,
        area_master: true,
        plot_schedule: {
          include: { mouza_master: true },
          orderBy: { schedule_id: 'asc' }
        }
      } : undefined
    })
  }

  async getProject(projCd: string): Promise<any> {
    return await db.project.findUnique({
      where: { projCd },
      include: { project_mines: true }
    })
  }

  async getMineMaster(mineCd: string): Promise<any> {
    return await db.mine_master.findUnique({ where: { mine_cd: mineCd } })
  }

  async getAreaMaster(areaCd: string): Promise<any> {
    return await db.area_master.findUnique({ where: { area_cd: areaCd } })
  }

  async getPlots(id: string, isUuid: boolean, includeRelations = true, mineCd?: string): Promise<any[]> {
    const plotWhereOr: any[] = []
    if (isUuid) {
      plotWhereOr.push({ proposal_id: id })
    }
    plotWhereOr.push({ acq_proposal: { proj_cd: id } })
    plotWhereOr.push({ acq_proposal: { proposal_no: id } })
    if (mineCd) {
      plotWhereOr.push({ acq_proposal: { mine_cd: mineCd } })
    }

    return await db.plot_schedule.findMany({
      where: { OR: plotWhereOr },
      include: includeRelations ? {
        mouza_master: true,
        plot_schedule_land_type: {
          include: {
            landtype_master: true,
            sub_landtype: true
          }
        }
      } : undefined,
      orderBy: { schedule_id: 'asc' },
    })
  }
}
