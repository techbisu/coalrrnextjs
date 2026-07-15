/**
 * Submit Proposal Use Case - Submits a proposal for Area Vetting.
 * Intercepts Limit Breaches for Form-XXII routing.
 */
import { IUseCase, Result, Fail, Ok } from '@/core'
import { IProposalRepository } from '@/domain/entities/proposal'
import { IProjectRepository } from '@/domain/entities/project/ProjectRepository.interface'
import { EventBus } from '@/core/notifications/EventBus'
import { auditQueue as AuditQueue } from '@/infrastructure/di/Container'
import { NotFoundException } from '@/core/errors'

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
    private readonly projectRepository: IProjectRepository
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

    // 3. Check for Limit Breaches (Form-XXII Exception)
    let isLimitBreached = false;
    const breachReasons: string[] = [];
    
    const projectAcreLimit = parseFloat(project.totalLandLimit.toDecimal().toString());
    const projectBudgetCeiling = parseFloat((project as any).totalBudgetCeiling?.toString() || "0");
    const projectEmploymentQuota = (project as any).totalEmploymentQuota || 0;
    
    const proposalArea = parseFloat(proposal.totalArea.toDecimal().toString());
    
    // In a real system, we would sum ALL active proposals, payrolls, and jobs for this project.
    // For this demonstration, we check if this single proposal exceeds the project's land limit,
    // or if standard dummy logic for budget/employment breaches.
    if (proposalArea > projectAcreLimit) {
      isLimitBreached = true;
      breachReasons.push('Land Area');
    }
    
    // Simulated budget check (e.g. 1 Acre = ~1,000,000 INR)
    const estimatedBudget = proposalArea * 1000000;
    if (estimatedBudget > projectBudgetCeiling) {
      isLimitBreached = true;
      breachReasons.push('Budget Ceiling');
    }
    
    // Simulated employment check (e.g. 1 Job per 2 Acres)
    const estimatedJobs = Math.floor(proposalArea / 2);
    if (estimatedJobs > projectEmploymentQuota) {
      isLimitBreached = true;
      breachReasons.push('Employment Quota');
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
    for (const event of domainEvents) {
      EventBus.publish({
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
      entity_name: 'land_schedule',
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
