/**
 * Add Plot to Proposal Use Case - Application service for adding plots to proposals.
 */
import { IUseCase, Result, Fail, Ok } from '@/core'
import { IProposalRepository } from '@/domain/entities/proposal'
import { EventBus } from '@/notifications/EventBus'
import { AuditQueue } from '@/audit/services/AuditQueue'
import { NotFoundException, ValidationException } from '@/core/errors'
import { db } from '@/lib/db' // temporary dependency to fetch plot area
import { Area } from '@/domain/value-objects/Area'

export interface AddPlotRequest {
  proposalId: string
  plotId: string
  annexureTag: 'A' | 'B' | 'C'
  userId: string
}

export interface AddPlotResponse {
  id: string
  scheduleCode: string
  totalAreaAcres: string
  message: string
}

export class AddPlotToProposalUseCase implements IUseCase<AddPlotRequest, AddPlotResponse> {
  constructor(
    private readonly proposalRepository: IProposalRepository
  ) {}

  async execute(request: AddPlotRequest): Promise<Result<AddPlotResponse>> {
    // 1. Find proposal
    const proposal = await this.proposalRepository.findById(request.proposalId)
    if (!proposal) {
      return Fail(new NotFoundException('Proposal', request.proposalId))
    }

    // 2. Validate plot availability
    const isAlreadyInActiveProposal = await this.proposalRepository.isPlotInActiveProposal(
      request.plotId, 
      request.proposalId
    )
    
    if (isAlreadyInActiveProposal) {
      return Fail(new ValidationException('Plot unavailable', [
        { field: 'plotId', message: 'Plot is already part of another active proposal' }
      ]))
    }

    // Get plot details (in a real app, this should use IPlotRepository)
    const plot = await db.mstPlot.findUnique({ where: { id: request.plotId } })
    if (!plot) {
      return Fail(new NotFoundException('Plot', request.plotId))
    }

    // 3. Execute business behavior on aggregate
    const plotAreaResult = Area.tryCreate(plot.areaAcres.toString(), 'ACRES')
    if (plotAreaResult.isFailure) return Fail(plotAreaResult.error!)

    const addResult = proposal.addPlot(request.plotId, (plotAreaResult as any).value)
    if (addResult.isFailure) {
      return Fail(addResult.error!)
    }

    // 4. Persist aggregate state
    await this.proposalRepository.save(proposal)
    
    // 5. Persist the relationship (many-to-many junction table)
    await this.proposalRepository.addPlotToProposal(
      request.proposalId,
      request.plotId,
      request.annexureTag
    )

    // 6. Audit logging
    AuditQueue.push({
      action: 'ADD_PLOT_TO_PROPOSAL',
      entityType: 'LandScheduleItem',
      entityId: request.proposalId,
      userId: request.userId,
      details: JSON.stringify({
        plotId: request.plotId,
        annexureTag: request.annexureTag,
      }),
    })

    // 7. Return response
    return Ok({
      id: proposal.id,
      scheduleCode: proposal.scheduleCode.value,
      totalAreaAcres: proposal.totalArea.toDecimal().toString(),
      message: `Plot ${plot.plotNumber} added to proposal ${proposal.scheduleCode.value}.`,
    })
  }
}
