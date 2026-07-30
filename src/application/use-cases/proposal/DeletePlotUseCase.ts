import { IUseCase, Result, Fail, Ok } from '@/core';
import { IProposalRepository } from '@/domain/entities/proposal';
import { auditQueue as AuditQueue } from '@/infrastructure/di/modules/core.di';

export interface DeletePlotRequest {
  proposalId: string;
  plotNo: string;
  userId: string;
}

export interface DeletePlotResponse {
  success: boolean;
  message: string;
}

export class DeletePlotUseCase implements IUseCase<DeletePlotRequest, DeletePlotResponse> {
  constructor(private readonly proposalRepo: IProposalRepository) {}

  async execute(request: DeletePlotRequest): Promise<Result<DeletePlotResponse>> {
    try {
      await this.proposalRepo.deletePlot(request.proposalId, request.plotNo);

      // Audit log
      AuditQueue.push({
        event_type: 'DELETE_PLOT_FROM_PROPOSAL',
        entity_name: 'plot_schedule',
        entity_id: request.proposalId,
        user_id: request.userId,
        remarks: `Deleted plot ${request.plotNo}`
      });

      return Ok({
        success: true,
        message: 'Plot deleted successfully'
      });
    } catch (e: any) {
      return Fail(e.message || 'Failed to delete plot');
    }
  }
}
