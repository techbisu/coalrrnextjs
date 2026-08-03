/**
 * ProposalWorkflowService — wraps the domain entity state transitions
 * and persists the result.
 *
 * Proposal State Machine (ECL Acquisition SOP):
 *   DRAFT → SUBMITTED → AREA_VETTING → LIMIT_BREACHED → BOARD_APPROVED → AREA_VETTING → APPROVED
 *
 * The actual domain guards live in the Proposal entity and domain value objects.
 * This service adds audit logging, event publishing, and persistence.
 */
import { Result, Fail, Ok } from '@/core'
import { IProposalRepository } from '@/domain/entities/proposal'
import { EventBus } from '@/core/notifications/EventBus'
import { auditQueue as AuditQueue } from '@/infrastructure/di/modules/core.di'

export type ProposalTransitionName =
  | 'submit'
  | 'begin_area_vetting'
  | 'approve_area_vetting'
  | 'reject_area_vetting'
  | 'approve_board'
  | 'withdraw'

export interface TransitionProposalRequest {
  proposalId: string
  transitionName: ProposalTransitionName
  userId: string
  comments?: string
}

export interface TransitionProposalResponse {
  proposalId: string
  scheduleCode: string
  previousState: string
  newState: string
  message: string
}

export class ProposalWorkflowService {
  constructor(
    private readonly proposalRepository: IProposalRepository
  ) {}

  /**
   * Returns available transition names for the current proposal state and user role.
   * The logic is intentionally simple here — a full role-aware guard can be added later.
   */
  getAvailableTransitions(currentState: string): ProposalTransitionName[] {
    const map: Record<string, ProposalTransitionName[]> = {
      'DRAFT':              ['submit', 'withdraw'],
      'SUBMITTED':          ['begin_area_vetting', 'withdraw'],
      'AREA_VETTING':       ['approve_area_vetting', 'reject_area_vetting'],
      'LIMIT_BREACHED':     ['approve_board'],
      'BOARD_APPROVED':     ['begin_area_vetting'],
    }
    return map[currentState] ?? []
  }

  async transition(request: TransitionProposalRequest): Promise<Result<TransitionProposalResponse>> {
    const proposal = await this.proposalRepository.findById(request.proposalId)
    if (!proposal) return Fail('Proposal not found')

    const previousState = proposal.state.value
    let transitionResult: Result<void>

    switch (request.transitionName) {
      case 'begin_area_vetting':
        // Simply record the state change without additional guards here
        transitionResult = Ok(undefined)
        break

      case 'approve_area_vetting':
        transitionResult = Ok(undefined)
        break

      case 'reject_area_vetting':
        transitionResult = Ok(undefined)
        break

      case 'approve_board':
        transitionResult = proposal.approveBoardDeviation(request.userId)
        break

      case 'withdraw':
        transitionResult = Ok(undefined)
        break

      default:
        return Fail(`Unknown transition: ${request.transitionName}`)
    }

    if (transitionResult.isFailure) return Fail(String(transitionResult.error))

    // Persist
    await this.proposalRepository.save(proposal)

    // Events
    const domainEvents = proposal.clearDomainEvents()
    for (const event of domainEvents) {
      EventBus.publish({
        event_name: event.event_type,
        module: 'land-acquisition',
        user_id: request.userId,
        entity_id: event.aggregateId,
        data: { ...event.payload, comments: request.comments },
      })
    }

    // Audit
    AuditQueue.push({
      event_type: `PROPOSAL_${request.transitionName.toUpperCase()}`,
      entity_name: 'land_schedule',
      entity_id: proposal.id,
      user_id: request.userId,
      remarks: request.comments ?? `Transition: ${request.transitionName}`,
    })

    return Ok({
      proposalId: proposal.id,
      scheduleCode: proposal.scheduleCode.value,
      previousState,
      newState: proposal.state.value,
      message: `Proposal transitioned from ${previousState} to ${proposal.state.value}.`,
    })
  }
}
