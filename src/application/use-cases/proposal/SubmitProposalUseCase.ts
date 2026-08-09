/**
 * Submit Proposal Use Case - Submits a proposal for Area Vetting.
 * Intercepts Limit Breaches for Form-XXII routing.
 */
import { IUseCase, Result, Fail, Ok } from '@/core'
import { MODULE_CODES } from '@/core/config/module-codes.config'
import { IProposalRepository } from '@/domain/entities/proposal'
import { IProjectRepository } from '@/domain/entities/project/ProjectRepository.interface'
import { ProjectLimitService } from '@/core/compliance/services/ProjectLimitService'
import { GetChecklistStatusUseCase } from '@/core/checklist/usecases/GetChecklistStatusUseCase'
import { ACQ_LAND_SCHEDULE } from '@/core/config/module-codes.config'
import { EventBus } from '@/core/notifications/EventBus'
import { auditQueue as AuditQueue } from '@/infrastructure/di/modules/core.di'

export interface SubmitProposalRequest {
  proposalId: string
  user_id: string
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
    private readonly proposalRepository: IProposalRepository,
    private readonly projectRepository: IProjectRepository,
    private readonly projectLimitService: ProjectLimitService,
    private readonly checklistStatusUseCase: GetChecklistStatusUseCase
  ) {}

  async execute(request: SubmitProposalRequest): Promise<Result<SubmitProposalResponse>> {
    // 1. Find proposal
    const proposal = await this.proposalRepository.findById(request.proposalId)
    if (!proposal) {
      return Fail('Proposal not found')
    }

    // 2. Find project limits
    const project = await this.projectRepository.findById(proposal.projectId)
    if (!project) {
      return Fail('Project not found')
    }

    // 3. Check for Limit Breaches using ProjectLimitService
    const limitCheckResult = await this.projectLimitService.checkProposalLimits(project, proposal)
    
    if (limitCheckResult.isFailure) {
      return Fail(String(limitCheckResult.error))
    }

    const { isLimitBreached, breachReasons } = limitCheckResult.value!

    // 3b. Gate on checklist completeness (query actual DB submissions)
    const checklistResult = await this.checklistStatusUseCase.execute({
      moduleCode: MODULE_CODES.LAND_SCHEDULE,
      checkableType: ACQ_LAND_SCHEDULE,
      checkableId: request.proposalId,
    })

    if (checklistResult.isFailure) {
      return Fail(`Checklist check failed: ${String(checklistResult.error)}`)
    }

    if (!checklistResult.value!.isComplete) {
      return Fail('All mandatory checklist items must be completed before submitting the proposal.')
    }

    // 4. Execute business behavior (includes checking invariants like checklist completion)
    const submitResult = proposal.submit(isLimitBreached)
    if (submitResult.isFailure) {
      return Fail(String(submitResult.error!))
    }

    // 5. Persist
    await this.proposalRepository.save(proposal)

    // 6. Publish events
    const domainEvents = proposal.clearDomainEvents()
    for (const event of domainEvents) { await EventBus.publish({
        event_name: event.event_type,
        module: 'land-acquisition',
        user_id: request.user_id,
        entity_id: event.aggregateId,
        data: {
          ...event.payload,
          comments: request.comments,
        },
      })
    }

    // 7. Audit logging
    AuditQueue.push({
      event_type: isLimitBreached ? 'PROPOSAL_LIMIT_BREACHED' : 'SUBMIT_PROPOSAL',
      entity_name: MODULE_CODES.LAND_SCHEDULE,
      entity_id: proposal.id,
      user_id: request.user_id,
      remarks: request.comments ?? (isLimitBreached ? 'Limit breached! Blocked standard approval.' : 'Submitted for Area Vetting'),
    })

    // 8. Return response
    return Ok({
      id: proposal.id,
      scheduleCode: proposal.scheduleCode.value,
      newState: proposal.state.value,
      message: isLimitBreached 
        ? `Proposal ${proposal.scheduleCode.value} breached the project limits. Routed for Form-XXII Board Escalation.` 
        : `Proposal ${proposal.scheduleCode.value} submitted successfully.`,
    })
  }
}
