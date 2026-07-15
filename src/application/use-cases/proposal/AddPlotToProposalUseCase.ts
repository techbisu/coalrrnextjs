/**
 * Add Plot to Proposal Use Case - Application service for adding plots to proposals.
 */
import { IUseCase, Result, Fail, Ok } from '@/core'
import { IProposalRepository } from '@/domain/entities/proposal'
import { EventBus } from '@/core/notifications/EventBus'
import { auditQueue as AuditQueue } from '@/infrastructure/di/Container'
import { NotFoundException, ValidationException } from '@/core/errors'
import { IPlotRepository } from '@/domain/entities/plot'
import { Area } from '@/domain/value-objects/Area'

export interface AddPlotRequest {
  proposalId: string
  plot_id: string
  annexure_tag: 'A' | 'B' | 'C'
  user_id: string
}

export interface AddPlotResponse {
  id: string
  schedule_code: string
  total_area_acres: string
  message: string
}

export class AddPlotToProposalUseCase implements IUseCase<AddPlotRequest, AddPlotResponse> {
  constructor(
    private readonly proposalRepository: IProposalRepository,
    private readonly plotRepository: IPlotRepository
  ) {}

  async execute(request: AddPlotRequest): Promise<Result<AddPlotResponse>> {
    // 1. Find proposal
    const proposal = await this.proposalRepository.findById(request.proposalId)
    if (!proposal) {
      return Fail('Proposal')
    }

    // 2. Validate plot availability
    const isAlreadyInActiveProposal = await this.proposalRepository.isPlotInActiveProposal(
      request.plot_id, 
      request.proposalId
    )
    
    if (isAlreadyInActiveProposal) {
      return Fail('Plot unavailable')
    }

    // Get plot details using IPlotRepository
    const plot = await this.plotRepository.findById(request.plot_id)
    if (!plot) {
      return Fail('Plot')
    }

    // 3. Execute business behavior on aggregate
    const plotAreaResult = Area.tryCreate(plot.area_acres.toString(), 'ACRES')
    if (plotAreaResult.isFailure) return Fail(String(plotAreaResult.error!))

    const addResult = proposal.addPlot(request.plot_id, (plotAreaResult as any).value)
    if (addResult.isFailure) {
      return Fail(String(addResult.error!))
    }

    // 4. Persist aggregate state
    await this.proposalRepository.save(proposal)
    
    // 5. Persist the relationship (many-to-many junction table)
    await this.proposalRepository.addPlotToProposal(
      request.proposalId,
      request.plot_id,
      request.annexure_tag
    )

    // 6. Audit logging
    AuditQueue.push({
      event_type: 'ADD_PLOT_TO_PROPOSAL',
      entity_name: 'land_schedule_item',
      entity_id: request.proposalId,
      user_id: request.user_id,
      remarks: JSON.stringify({
        plot_id: request.plot_id,
        annexure_tag: request.annexure_tag,
      }),
    })

    // 7. Return response
    return Ok({
      id: proposal.id,
      schedule_code: proposal.scheduleCode.value,
      total_area_acres: proposal.totalArea.toDecimal().toString(),
      message: `Plot ${plot.plot_number} added to proposal ${proposal.scheduleCode.value}.`,
    })
  }
}
