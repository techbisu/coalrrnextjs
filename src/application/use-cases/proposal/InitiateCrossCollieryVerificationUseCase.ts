import { IUseCase, Result, Fail, Ok } from '@/core';
import { IProposalRepository, ProposalState } from '@/domain/entities/proposal';
import { auditQueue as AuditQueue } from '@/infrastructure/di/modules/core.di';

export interface InitiateCrossCollieryVerificationRequest {
  proposalId: string;
  userId: string;
  remarks?: string;
}

export interface InitiateCrossCollieryVerificationResponse {
  success: boolean;
  message: string;
  newState: string;
}

export class InitiateCrossCollieryVerificationUseCase implements IUseCase<InitiateCrossCollieryVerificationRequest, InitiateCrossCollieryVerificationResponse> {
  constructor(private readonly proposalRepo: IProposalRepository) {}

  async execute(request: InitiateCrossCollieryVerificationRequest): Promise<Result<InitiateCrossCollieryVerificationResponse>> {
    try {
      const proposal = await this.proposalRepo.findById(request.proposalId);
      if (!proposal) {
        return Fail('Proposal not found');
      }

      // Transition state
      const targetState = ProposalState.CROSS_COLLIERY_VERIFICATION;
      
      if (!proposal.state.canTransitionTo(targetState)) {
         return Fail(`Cannot transition proposal from ${proposal.state.value} to ${targetState.value}`);
      }

      (proposal as any)._state = targetState;

      await this.proposalRepo.save(proposal);

      // Audit log
      AuditQueue.push({
        event_type: 'INITIATE_CROSS_COLLIERY_VERIFICATION',
        entity_name: 'land_schedule',
        entity_id: request.proposalId,
        user_id: request.userId,
        remarks: request.remarks || 'Initiated Cross-Colliery Verification Mode due to LIS Overlap.'
      });

      return Ok({
        success: true,
        message: 'Cross-Colliery Verification Mode initiated successfully.',
        newState: targetState.value
      });
    } catch (e: any) {
      return Fail(e.message || 'Failed to initiate Cross-Colliery Verification');
    }
  }
}
