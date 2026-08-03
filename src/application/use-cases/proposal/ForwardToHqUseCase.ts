import { IUseCase, Result, Fail, Ok } from '@/core';
import { IProposalRepository, ProposalState } from '@/domain/entities/proposal';
import { auditQueue as AuditQueue } from '@/infrastructure/di/modules/core.di';
// import { JobDispatcherService } from '@/core/jobs/services/JobDispatcherService'; 
// Assuming JobDispatcherService is used for parallel background jobs, but for now we'll mock the distribution

export interface ForwardToHqRequest {
  proposalId: string;
  userId: string;
  comments?: string;
}

export interface ForwardToHqResponse {
  success: boolean;
  message: string;
  newState: string;
}

export class ForwardToHqUseCase implements IUseCase<ForwardToHqRequest, ForwardToHqResponse> {
  constructor(private readonly proposalRepo: IProposalRepository) {}

  async execute(request: ForwardToHqRequest): Promise<Result<ForwardToHqResponse>> {
    try {
      const proposal = await this.proposalRepo.findById(request.proposalId);
      if (!proposal) {
        return Fail('Proposal not found');
      }

      // Transition state
      const targetState = ProposalState.HQ_VETTING;
      
      if (!proposal.state.canTransitionTo(targetState)) {
         return Fail(`Cannot transition proposal from ${proposal.state.value} to ${targetState.value}. Proposal must be in AreaVetting.`);
      }

      proposal.updateState(targetState);

      await this.proposalRepo.save(proposal);

      // Audit log & Task Distribution
      AuditQueue.push({
        event_type: 'FORWARD_TO_HQ',
        entity_name: 'land_schedule',
        entity_id: request.proposalId,
        user_id: request.userId,
        remarks: request.comments || 'Forwarded to HQ Level Parallel Vetting (Planning, Safety, Finance).'
      });

      // TODO: Use JobDispatcherService to create tasks for GM Planning, GM Safety, GM Finance
      // Container.jobDispatcher.dispatch('createHqVettingTasks', { proposalId: request.proposalId })

      return Ok({
        success: true,
        message: 'Proposal forwarded to HQ for parallel vetting.',
        newState: targetState.value
      });
    } catch (e: any) {
      return Fail(e.message || 'Failed to forward to HQ');
    }
  }
}
