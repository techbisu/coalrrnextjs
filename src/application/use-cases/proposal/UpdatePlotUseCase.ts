import { IUseCase, Result, Fail, Ok } from '@/core';
import { IProposalRepository, PlotScheduleDTO, PlotScheduleLandTypeDTO } from '@/domain/entities/proposal';
import { auditQueue as AuditQueue } from '@/infrastructure/di/modules/core.di';
import { jobDispatcher } from '@/core/jobs/services/JobDispatcherService';

export interface UpdatePlotRequest {
  proposalId: string;
  plotNo: string;
  plotData: PlotScheduleDTO;
  landTypesData: PlotScheduleLandTypeDTO[];
  userId: string;
}

export interface UpdatePlotResponse {
  success: boolean;
  message: string;
}

export class UpdatePlotUseCase implements IUseCase<UpdatePlotRequest, UpdatePlotResponse> {
  constructor(private readonly proposalRepo: IProposalRepository) {}

  async execute(request: UpdatePlotRequest): Promise<Result<UpdatePlotResponse>> {
    try {
      // Check if updating the plot_no to something that already exists elsewhere
      if (request.plotNo !== request.plotData.plot_no) {
        const hasDuplicates = await this.proposalRepo.checkDuplicatePlots([request.plotData.plot_no], request.plotData.mouza_lgd, request.proposalId);
        if (hasDuplicates) {
          return Fail('The target plot number is already part of an active proposal.');
        }
      }

      await this.proposalRepo.updatePlot(request.proposalId, request.plotNo, request.plotData, request.landTypesData);

      // Audit log
      AuditQueue.push({
        event_type: 'UPDATE_PLOT_IN_PROPOSAL',
        entity_name: 'plot_schedule',
        entity_id: request.proposalId,
        user_id: request.userId,
        remarks: `Updated plot ${request.plotNo}`
      });

      // Sync checklist context
      await jobDispatcher.dispatch('syncChecklistContext', {
        moduleCode: 'LAND_ACQ_PROPOSAL',
        entityId: request.proposalId
      });

      return Ok({
        success: true,
        message: 'Plot updated successfully'
      });
    } catch (e: any) {
      return Fail(e.message || 'Failed to update plot');
    }
  }
}
