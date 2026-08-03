import { IUseCase, Result, Fail, Ok } from '@/core';
import { IProposalRepository, PlotScheduleDTO, PlotScheduleLandTypeDTO, DuplicatePlotException } from '@/domain/entities/proposal';
import { auditQueue as AuditQueue } from '@/infrastructure/di/modules/core.di';

export interface AddPlotsRequest {
  proposalId: string;
  plots: PlotScheduleDTO[];
  landTypes: PlotScheduleLandTypeDTO[];
  mouzaLgd: number;
  userId: string;
}

export interface AddPlotsResponse {
  success: boolean;
  message: string;
}

export class AddPlotsToProposalUseCase implements IUseCase<AddPlotsRequest, AddPlotsResponse> {
  constructor(private readonly proposalRepo: IProposalRepository) {}

  async execute(request: AddPlotsRequest): Promise<Result<AddPlotsResponse>> {
    try {
      const proposal = await this.proposalRepo.getProposalById(request.proposalId);
      if (!proposal) {
        return Fail('Proposal not found');
      }

      // Check duplicates
      const plotNos = request.plots.map(p => p.plot_no);
      const hasDuplicates = await this.proposalRepo.checkDuplicatePlots(plotNos, request.mouzaLgd);
      if (hasDuplicates) {
        throw new DuplicatePlotException(`One or more requested plots have already been acquired or are in an active proposal. Hard Stop.`);
      }

      // Add to repository
      await this.proposalRepo.addPlots(request.proposalId, request.plots, request.landTypes);

      // Audit log
      AuditQueue.push({
        event_type: 'ADD_PLOTS_TO_PROPOSAL',
        entity_name: 'plot_schedule',
        entity_id: request.proposalId,
        user_id: request.userId,
        remarks: `Added ${request.plots.length} plots.`
      });

      return Ok({
        success: true,
        message: 'Plots added successfully'
      });
    } catch (e: any) {
      return Fail(e.message || 'Failed to add plots');
    }
  }
}
