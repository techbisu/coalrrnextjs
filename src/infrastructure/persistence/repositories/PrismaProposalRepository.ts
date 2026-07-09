/**
 * Prisma Proposal Repository - Concrete implementation of IProposalRepository.
 * This belongs in the infrastructure layer and handles all database operations.
 * NO BUSINESS LOGIC HERE - only persistence concerns.
 */
import { db } from '@/lib/db'
import { Proposal, IProposalRepository, IProposalQueryOptions } from '@/domain'
import { IPaginatedResult } from '@/core/interfaces'
import Decimal from 'decimal.js'

export class PrismaProposalRepository implements IProposalRepository {
  
  async findById(id: string): Promise<Proposal | null> {
    const data = await db.landSchedule.findUnique({
      where: { id },
      include: {
        items: { 
          where: { isActive: true }
        }
      }
    })

    if (!data) return null

    return Proposal.reconstitute({
      id: data.id,
      scheduleCode: data.scheduleCode,
      projectId: data.projectId,
      acquisitionMode: data.acquisitionMode,
      state: data.state,
      proposalTitle: data.proposalTitle ?? '',
      description: data.description ?? '',
      proposedBy: data.proposedBy ?? '',
      proposedByRole: data.proposedByRole ?? '',
      areaOffice: data.areaOffice ?? '',
      collieryCode: data.collieryCode ?? '',
      adjacentColliery: data.adjacentColliery ?? '',
      totalAreaAcres: data.totalAreaAcres.toString(),
      notificationDate: data.notificationDate,
      modeSpecificChecklist: data.modeSpecificChecklist ?? '{"items":[]}',
      plotIds: data.items.map(item => item.plotId),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    })
  }

  async findAll(options?: IProposalQueryOptions): Promise<IPaginatedResult<Proposal>> {
    const page = options?.page ?? 1
    const pageSize = options?.pageSize ?? 20
    const skip = (page - 1) * pageSize

    const where: any = {}
    
    if (options?.projectId) {
      where.projectId = options.projectId
    }

    if (options?.state) {
      where.state = options.state
    }

    if (options?.acquisitionMode) {
      where.acquisitionMode = options.acquisitionMode
    }
    
    if (options?.collieryCode) {
      where.collieryCode = options.collieryCode
    }
    
    if (options?.search) {
      where.OR = [
        { scheduleCode: { contains: options.search, mode: 'insensitive' } },
        { proposalTitle: { contains: options.search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      db.landSchedule.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: options?.orderBy ?? { createdAt: 'desc' },
        include: {
          items: { where: { isActive: true } }
        }
      }),
      db.landSchedule.count({ where }),
    ])

    const proposals = data.map(p => Proposal.reconstitute({
      id: p.id,
      scheduleCode: p.scheduleCode,
      projectId: p.projectId,
      acquisitionMode: p.acquisitionMode,
      state: p.state,
      proposalTitle: p.proposalTitle ?? '',
      description: p.description ?? '',
      proposedBy: p.proposedBy ?? '',
      proposedByRole: p.proposedByRole ?? '',
      areaOffice: p.areaOffice ?? '',
      collieryCode: p.collieryCode ?? '',
      adjacentColliery: p.adjacentColliery ?? '',
      totalAreaAcres: p.totalAreaAcres.toString(),
      notificationDate: p.notificationDate,
      modeSpecificChecklist: p.modeSpecificChecklist ?? '{"items":[]}',
      plotIds: p.items.map(item => item.plotId),
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }))

    return {
      data: proposals,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  }

  async findByScheduleCode(scheduleCode: string): Promise<Proposal | null> {
    const data = await db.landSchedule.findFirst({
      where: { scheduleCode },
      include: { items: { where: { isActive: true } } }
    })

    if (!data) return null

    return Proposal.reconstitute({
      id: data.id,
      scheduleCode: data.scheduleCode,
      projectId: data.projectId,
      acquisitionMode: data.acquisitionMode,
      state: data.state,
      proposalTitle: data.proposalTitle ?? '',
      description: data.description ?? '',
      proposedBy: data.proposedBy ?? '',
      proposedByRole: data.proposedByRole ?? '',
      areaOffice: data.areaOffice ?? '',
      collieryCode: data.collieryCode ?? '',
      adjacentColliery: data.adjacentColliery ?? '',
      totalAreaAcres: data.totalAreaAcres.toString(),
      notificationDate: data.notificationDate,
      modeSpecificChecklist: data.modeSpecificChecklist ?? '{"items":[]}',
      plotIds: data.items.map(item => item.plotId),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    })
  }

  async findByProjectId(projectId: string, options?: IProposalQueryOptions): Promise<IPaginatedResult<Proposal>> {
    return this.findAll({ ...options, projectId })
  }

  async save(proposal: Proposal): Promise<void> {
    const data = proposal.toPersistence()
    
    const exists = await this.exists(proposal.id)
    
    if (exists) {
      await db.landSchedule.update({
        where: { id: data.id },
        data: {
          state: data.state,
          proposalTitle: data.proposalTitle,
          description: data.description,
          areaOffice: data.areaOffice,
          adjacentColliery: data.adjacentColliery,
          totalAreaAcres: new Decimal(data.totalAreaAcres),
          notificationDate: data.notificationDate,
          modeSpecificChecklist: data.modeSpecificChecklist,
          updatedAt: new Date(),
        },
      })
    } else {
      await db.landSchedule.create({
        data: {
          id: data.id,
          scheduleCode: data.scheduleCode,
          projectId: data.projectId,
          acquisitionMode: data.acquisitionMode,
          state: data.state,
          proposalTitle: data.proposalTitle,
          description: data.description,
          proposedBy: data.proposedBy,
          proposedByRole: data.proposedByRole,
          areaOffice: data.areaOffice,
          collieryCode: data.collieryCode,
          adjacentColliery: data.adjacentColliery,
          totalAreaAcres: new Decimal(data.totalAreaAcres),
          notificationDate: data.notificationDate,
          modeSpecificChecklist: data.modeSpecificChecklist,
        },
      })
    }
  }

  async delete(id: string): Promise<void> {
    await db.landSchedule.delete({ where: { id } })
  }

  async exists(id: string): Promise<boolean> {
    const count = await db.landSchedule.count({ where: { id } })
    return count > 0
  }

  async addPlotToProposal(proposalId: string, plotId: string, annexureTag: 'A' | 'B' | 'C'): Promise<void> {
    await db.landScheduleItem.create({
      data: {
        scheduleId: proposalId,
        plotId,
        annexureTag,
        isActive: true
      }
    })
  }

  async removePlotFromProposal(proposalId: string, plotId: string): Promise<void> {
    // Soft delete pattern to maintain history
    await db.landScheduleItem.updateMany({
      where: {
        scheduleId: proposalId,
        plotId,
        isActive: true
      },
      data: {
        isActive: false
      }
    })
  }

  async updatePlotAnnexure(proposalId: string, plotId: string, annexureTag: 'A' | 'B' | 'C'): Promise<void> {
    await db.landScheduleItem.updateMany({
      where: {
        scheduleId: proposalId,
        plotId,
        isActive: true
      },
      data: {
        annexureTag
      }
    })
  }

  async isPlotInActiveProposal(plotId: string, currentProposalId?: string): Promise<boolean> {
    const query: any = {
      plotId,
      isActive: true,
      schedule: {
        state: { not: 'Cancelled' }
      }
    }
    
    if (currentProposalId) {
      query.scheduleId = { not: currentProposalId }
    }
    
    const count = await db.landScheduleItem.count({ where: query })
    return count > 0
  }

  // For dashboard/UI specific complex queries
  async getProposalDetailsWithPlots(id: string): Promise<any> {
    return db.landSchedule.findUnique({
      where: { id },
      include: {
        project: true,
        items: {
          where: { isActive: true },
          include: { 
            plot: { 
              include: { mouza: true } 
            } 
          }
        }
      }
    })
  }
}
