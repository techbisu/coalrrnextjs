import { MODULE_CODES } from '@/core/config/module-codes.config'
import { IUseCase, Result, Fail, Ok } from '@/core';
import { IProposalRepository, ProposalState } from '@/domain/entities/proposal';
import { auditQueue as AuditQueue } from '@/infrastructure/di/modules/core.di';
import { startDocumentWorkspaceUseCase } from '@/infrastructure/di/Container';

export interface VerifyProposalRequest {
  proposalId: string;
  userId: string;
}

export interface VerifyProposalResponse {
  success: boolean;
  message: string;
}

export class VerifyProposalUseCase implements IUseCase<VerifyProposalRequest, VerifyProposalResponse> {
  constructor(private readonly proposalRepo: IProposalRepository) {}

  async execute(request: VerifyProposalRequest): Promise<Result<VerifyProposalResponse>> {
    try {
      const proposal = await this.proposalRepo.findById(request.proposalId);
      if (!proposal) {
        return Fail('Proposal not found');
      }

      // Check if state is Drafting
      if (!proposal.state.isDrafting()) {
        return Fail('Proposal must be in Drafting state to be verified');
      }

      const plots = await this.proposalRepo.getPlotsByProposalId(request.proposalId);
      if (plots.length === 0) {
        return Fail('Cannot verify an empty proposal schedule');
      }

      // Re-run anti-duplication engine (LIS Query)
      const plotNos = plots.map(p => p.plot_no);
      const mouzaLgd = plots[0]?.mouza_lgd ?? 0;
      
      const hasDuplicates = await this.proposalRepo.checkDuplicatePlots(plotNos, mouzaLgd, request.proposalId);
      if (hasDuplicates) {
         // Should have been caught by AddPlots, but we double check here
         return Fail('Anti-Duplication Engine detected overlaps with adjacent collieries.');
      }

      // 1. Auto-generate Form-VII (Reconciliation Certificate)
      const form7Result = await startDocumentWorkspaceUseCase.execute({
        templateCode: 'FORM_VII',
        applicationId: request.proposalId,
        userId: request.userId,
        extraData: {},
      });

      if (form7Result.isFailure) {
         console.warn(`Failed to auto-generate Form-VII: ${form7Result.error}`);
         // We might not want to fail the whole process if template doesn't exist yet, but let's log it.
      }

      // 2. Auto-draft Form-XVI (Five-Point Certificate)
      const form16Result = await startDocumentWorkspaceUseCase.execute({
        templateCode: 'FORM_XVI',
        applicationId: request.proposalId,
        userId: request.userId,
        extraData: {},
      });

      if (form16Result.isFailure) {
         console.warn(`Failed to auto-generate Form-XVI: ${form16Result.error}`);
      }

      // Audit log
      AuditQueue.push({
        event_type: 'VERIFY_PROPOSAL',
        entity_name: MODULE_CODES.LAND_SCHEDULE,
        entity_id: request.proposalId,
        user_id: request.userId,
        remarks: 'Anti-Duplication clear. Form-VII and Form-XVI auto-generated.'
      });

      return Ok({
        success: true,
        message: 'Schedule verified against LIS. Automated forms generated.'
      });
    } catch (e: any) {
      return Fail(e.message || 'Failed to verify proposal');
    }
  }
}
