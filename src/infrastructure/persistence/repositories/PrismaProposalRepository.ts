import { db } from '@/lib/db'
import { Proposal, IProposalRepository, IProposalQueryOptions } from '@/domain'
import { IPaginatedResult } from '@/core/interfaces'
import Decimal from 'decimal.js'

export class PrismaProposalRepository implements IProposalRepository {
  
  async findById(id: string): Promise<Proposal | null> {
    const data = await db.land_schedule.findUnique({
      where: { id },
      include: {
        items: { 
          where: { is_active: true }
        }
      }
    })

    if (!data) return null

    return Proposal.reconstitute({
      id: data.id,
      scheduleCode: data.schedule_code,
      projectId: data.project_id,
      acquisitionMode: data.acquisition_mode,
      state: data.state,
      proposalTitle: data.proposal_title ?? '',
      description: data.description ?? '',
      proposedBy: data.proposed_by ?? '',
      proposedByRole: data.proposed_by_role ?? '',
      areaOffice: data.area_office ?? '',
      collieryCode: data.mine_cd ?? '',
      adjacentColliery: data.adjacent_colliery ?? '',
      totalAreaAcres: data.total_area_acres.toString(),
      notificationDate: data.notification_date,
      modeSpecificChecklist: data.mode_specific_checklist ?? '{"items":[]}',
      plotIds: data.items.map(item => item.plot_id),
      createdAt: data.entry_ts,
      updatedAt: data.updt_ts,
    })
  }

  async findAll(options?: IProposalQueryOptions): Promise<IPaginatedResult<Proposal>> {
    const page = options?.page ?? 1
    const pageSize = options?.pageSize ?? 20
    const skip = (page - 1) * pageSize

    const where: any = {}
    if (options?.project_id) where.project_id = options.project_id
    if (options?.state) where.state = options.state

    const [items, total] = await Promise.all([
      db.land_schedule.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { entry_ts: 'desc' },
        include: { items: { where: { is_active: true } } }
      }),
      db.land_schedule.count({ where })
    ])

    return {
      data: items.map(data => Proposal.reconstitute({
        id: data.id,
        scheduleCode: data.schedule_code,
        projectId: data.project_id,
        acquisitionMode: data.acquisition_mode,
        state: data.state,
        proposalTitle: data.proposal_title ?? '',
        description: data.description ?? '',
        proposedBy: data.proposed_by ?? '',
        proposedByRole: data.proposed_by_role ?? '',
        areaOffice: data.area_office ?? '',
        collieryCode: data.mine_cd ?? '',
        adjacentColliery: data.adjacent_colliery ?? '',
        totalAreaAcres: data.total_area_acres.toString(),
        notificationDate: data.notification_date,
        modeSpecificChecklist: data.mode_specific_checklist ?? '{"items":[]}',
        plotIds: data.items.map(item => item.plot_id),
        createdAt: data.entry_ts,
        updatedAt: data.updt_ts,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  }

  async findByScheduleCode(scheduleCode: string): Promise<Proposal | null> {
    const data = await db.land_schedule.findFirst({
      where: { schedule_code: scheduleCode },
      include: { items: { where: { is_active: true } } }
    })

    if (!data) return null

    return Proposal.reconstitute({
      id: data.id,
      scheduleCode: data.schedule_code,
      projectId: data.project_id,
      acquisitionMode: data.acquisition_mode,
      state: data.state,
      proposalTitle: data.proposal_title ?? '',
      description: data.description ?? '',
      proposedBy: data.proposed_by ?? '',
      proposedByRole: data.proposed_by_role ?? '',
      areaOffice: data.area_office ?? '',
      collieryCode: data.mine_cd ?? '',
      adjacentColliery: data.adjacent_colliery ?? '',
      totalAreaAcres: data.total_area_acres.toString(),
      notificationDate: data.notification_date,
      modeSpecificChecklist: data.mode_specific_checklist ?? '{"items":[]}',
      plotIds: data.items.map(item => item.plot_id),
      createdAt: data.entry_ts,
      updatedAt: data.updt_ts,
    })
  }

  async findByProjectId(projectId: string, options?: IProposalQueryOptions): Promise<IPaginatedResult<Proposal>> {
    return this.findAll({ ...options, project_id: projectId } as any)
  }

  async save(proposal: Proposal): Promise<void> {
    const data = proposal.toPersistence()
    
    const exists = await this.exists(proposal.id)
    
    if (exists) {
      await db.land_schedule.update({
        where: { id: data.id },
        data: {
          state: data.state,
          proposal_title: data.proposalTitle,
          description: data.description,
          area_office: data.areaOffice,
          adjacent_colliery: data.adjacentColliery,
          total_area_acres: new Decimal(data.totalAreaAcres),
          notification_date: data.notificationDate,
          mode_specific_checklist: data.modeSpecificChecklist,
          updt_ts: new Date(),
        },
      })
    } else {
      await db.land_schedule.create({
        data: {
          id: data.id,
          schedule_code: data.scheduleCode,
          project_id: data.projectId,
          acquisition_mode: data.acquisitionMode,
          state: data.state,
          proposal_title: data.proposalTitle,
          description: data.description,
          proposed_by: data.proposedBy,
          proposed_by_role: data.proposedByRole,
          area_office: data.areaOffice,
          mine_cd: data.collieryCode,
          adjacent_colliery: data.adjacentColliery,
          total_area_acres: new Decimal(data.totalAreaAcres),
          notification_date: data.notificationDate,
          mode_specific_checklist: data.modeSpecificChecklist,
        },
      })
    }
  }

  async delete(id: string): Promise<void> {
    await db.land_schedule.delete({ where: { id } })
  }

  async exists(id: string): Promise<boolean> {
    const count = await db.land_schedule.count({ where: { id } })
    return count > 0
  }

  async addPlotToProposal(scheduleId: string, plotId: string, annexureTag?: string): Promise<void> {
    await db.land_schedule_item.create({
      data: {
        schedule_id: scheduleId,
        plot_id: plotId,
        annexure_tag: annexureTag,
        is_active: true
      }
    })
  }

  async removePlotFromProposal(scheduleId: string, plotId: string): Promise<void> {
    await db.land_schedule_item.updateMany({
      where: {
        schedule_id: scheduleId,
        plot_id: plotId,
      },
      data: {
        is_active: false
      }
    })
  }

  async isPlotInActiveProposal(plotId: string): Promise<boolean> {
    const count = await db.land_schedule_item.count({
      where: {
        plot_id: plotId,
        is_active: true
      }
    })
    return count > 0
  }

  async updatePlotAnnexure(scheduleId: string, plotId: string, annexureTag: string): Promise<void> {
    await db.land_schedule_item.updateMany({
      where: {
        schedule_id: scheduleId,
        plot_id: plotId,
      },
      data: {
        annexure_tag: annexureTag
      }
    })
  }

  async getProposalDetailsWithPlots(id: string): Promise<any> {
    return await db.land_schedule.findUnique({
      where: { id },
      include: {
        project: true,
        items: {
          include: {
            plot: {
              include: {
                mouza: true
              }
            }
          }
        }
      }
    })
  }
}
