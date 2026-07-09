/**
 * Submit Proposal Use Case - Submits a proposal for Area Vetting.
 */
import { IUseCase, Result, Fail, Ok } from '@/core'
import { IProposalRepository } from '@/domain/entities/proposal'
import { EventBus } from '@/notifications/EventBus'
import { AuditQueue } from '@/audit/services/AuditQueue'
import { NotFoundException } from '@/core/errors'

export interface SubmitProposalRequest {
  proposalId: string
  userId: string
  comments?: string
}

export interface SubmitProposalResponse {
  id: string
  scheduleCode: string
  newState: string
  message: string
}

export class SubmitProposalUseCase implements IUseCase<SubmitProposalRequest, SubmitProposalResponse> {
  constructor(
    private readonly proposalRepository: IProposalRepository
  ) {}

  async execute(request: SubmitProposalRequest): Promise<Result<SubmitProposalResponse>> {
    // 1. Find proposal
    const proposal = await this.proposalRepository.findById(request.proposalId)
    if (!proposal) {
      return Fail(new NotFoundException('Proposal', request.proposalId))
    }

    // 2. Execute business behavior (includes checking invariants like checklist completion)
    const submitResult = proposal.submit()
    if (submitResult.isFailure) {
      return Fail(submitResult.error!)
    }

    // 3. Persist
    await this.proposalRepository.save(proposal)

    // 4. Publish events
    const domainEvents = proposal.clearDomainEvents()
    for (const event of domainEvents) {
      EventBus.publish({
        eventName: event.eventType,
        module: 'land-acquisition',
        userId: request.userId,
        entityId: event.aggregateId,
        data: {
          ...event.payload,
          comments: request.comments,
        },
      })
    }

    // 5. Audit logging
    AuditQueue.push({
      action: 'SUBMIT_PROPOSAL',
      entityType: 'LandSchedule',
      entityId: proposal.id,
      userId: request.userId,
      details: request.comments ?? 'Submitted for Area Vetting',
    })

    // 6. Return response
    return Ok({
      id: proposal.id,
      scheduleCode: proposal.scheduleCode.value,
      newState: proposal.state.value,
      message: `Proposal ${proposal.scheduleCode.value} submitted successfully.`,
    })
  }
}
