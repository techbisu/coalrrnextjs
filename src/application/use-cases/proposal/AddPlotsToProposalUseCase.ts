import { IUseCase, Result, Fail, Ok } from '@/core';
import { IProposalRepository, PlotScheduleDTO, PlotScheduleLandTypeDTO, DuplicatePlotException } from '@/domain/entities/proposal';
import { auditQueue as AuditQueue } from '@/infrastructure/di/modules/core.di';
import { jobDispatcher } from '@/core/jobs/services/JobDispatcherService';

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

      // Auto-detection logic for proposal flags based on land types
      const landTypeIds = request.landTypes.map(lt => lt.landt_id);
      
      // Need Prisma to fetch the names or master_category of the land types
      // Since UseCases shouldn't depend directly on Prisma if possible, but here we might need to.
      // Or we can add a method to proposalRepo to update these flags based on the land types.
      // Let's implement it here via the proposalRepo, or via Prisma directly for now (following the codebase pattern if any).
      
      // Wait, proposalRepo.getProposalById returns any, maybe? Let's fetch the domain proposal
      const domainProposal = await this.proposalRepo.findById(request.proposalId);
      if (domainProposal) {
        // We need to fetch the land type names to check. We will add a method to proposalRepo or use a simple query
        // But since this is a clean architecture, let's assume `proposalRepo.getLandTypesByIds` exists, 
        // if not we'll update the repo.
        const landTypeDetails = await this.proposalRepo.getLandTypeDetails(landTypeIds);
        
        let hasDebottar = domainProposal.hasDebottarLand;
        let hasTribal = domainProposal.hasTribalLand;
        let hasDisputed = domainProposal.hasDisputedLand;
        
        for (const lt of landTypeDetails) {
          const name = lt.land_type.toLowerCase();
          const cat = (lt.master_category || '').toLowerCase();
          
          if (name.includes('debottar') || cat.includes('debottar')) hasDebottar = true;
          if (name.includes('tribal') || cat.includes('tribal')) hasTribal = true;
          if (name.includes('disputed') || cat.includes('disputed')) hasDisputed = true;
        }

        let flagsUpdated = false;
        
        if (hasDebottar !== domainProposal.hasDebottarLand) {
           (domainProposal as any)._hasDebottarLand = hasDebottar;
           flagsUpdated = true;
        }
        if (hasTribal !== domainProposal.hasTribalLand) {
           (domainProposal as any)._hasTribalLand = hasTribal;
           flagsUpdated = true;
        }
        if (hasDisputed !== domainProposal.hasDisputedLand) {
           (domainProposal as any)._hasDisputedLand = hasDisputed;
           flagsUpdated = true;
        }

        if (flagsUpdated) {
          await this.proposalRepo.save(domainProposal);
        }
      }

      // Audit log
      AuditQueue.push({
        event_type: 'ADD_PLOTS_TO_PROPOSAL',
        entity_name: 'plot_schedule',
        entity_id: request.proposalId,
        user_id: request.userId,
        remarks: `Added ${request.plots.length} plots.`
      });

      // Sync checklist context
      await jobDispatcher.dispatch('syncChecklistContext', {
        moduleCode: 'LAND_ACQ_PROPOSAL',
        entityId: request.proposalId
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
