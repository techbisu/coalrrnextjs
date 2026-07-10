/**
 * Update Proposal Use Case - Application service for updating proposal details.
 */
import { IUseCase, Result, Fail, Ok } from '@/core'
import { IProposalRepository } from '@/domain/entities/proposal'
import { EventBus } from '@/core/notifications/EventBus'
import { auditQueue as AuditQueue } from '@/infrastructure/di/Container'
import { NotFoundException } from '@/core/errors'

export interface UpdateProposalRequest {
  proposalId: string
  proposalTitle?: string
  description?: string
  area_office?: string
  adjacent_colliery?: string
  notification_date?: Date
  user_id: string
}

export interface UpdateProposalResponse {
  id: string
  savedAt: string
  message: string
}

export class UpdateProposalUseCase implements IUseCase<UpdateProposalRequest, UpdateProposalResponse> {
  constructor(
    private readonly proposalRepository: IProposalRepository
  ) {}

  async execute(request: UpdateProposalRequest): Promise<Result<UpdateProposalResponse>> {
    // 1. Find proposal
    const proposal = await this.proposalRepository.findById(request.proposalId)
    if (!proposal) {
      return Fail('Proposal')
    }

    // 2. Execute business behavior (includes state validation)
    const updateResult = proposal.update({
      proposalTitle: request.proposalTitle,
      description: request.description,
      area_office: request.area_office,
      adjacent_colliery: request.adjacent_colliery,
      notification_date: request.notification_date
    })

    if (updateResult.isFailure) {
      return Fail(String(updateResult.error!))
    }

    // 3. Persist aggregate state
    await this.proposalRepository.save(proposal)
    
    // 4. Publish events (if any state changed that requires an event)
    const domainEvents = proposal.clearDomainEvents()
    for (const event of domainEvents) {
      EventBus.publish({
        event_name: event.event_type,
        module: 'land-acquisition',
        user_id: request.user_id,
        entity_id: event.aggregateId,
        data: event.payload,
      })
    }

    // 5. Audit logging
    AuditQueue.push({
      event_type: 'UPDATE_PROPOSAL',
      entity_name: 'land_schedule',
      entity_id: proposal.id,
      user_id: request.user_id,
      remarks: 'Proposal details updated',
    })

    // 6. Return response
    return Ok({
      id: proposal.id,
      savedAt: new Date().toISOString(),
      message: 'Proposal updated successfully.',
    })
  }
}
