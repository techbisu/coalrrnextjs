import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result } from '@/core/result/Result'
import { IProposalRepository, ProposalDTO, PlotScheduleDTO, PlotScheduleLandTypeDTO } from '@/domain/entities/proposal';

export interface InitiateProposalRequest {
  proposal: Omit<ProposalDTO, 'proposal_id' | 'current_stage_cd' | 'overall_status'>;
  plots?: Omit<PlotScheduleDTO, 'schedule_id' | 'proposal_id'>[];
  landTypes?: Omit<PlotScheduleLandTypeDTO, 'schedule_land_type_id' | 'schedule_id'>[];
}

export class InitiateProposalUseCase implements IUseCase<InitiateProposalRequest, string> {
  constructor(private repo: IProposalRepository) {}

  async execute(req: InitiateProposalRequest): Promise<Result<string>> {
    try {
      // 1. Validation Logic
      // 2. Anti-Duplication Check across requested plots
      if (req.plots && req.plots.length > 0) {
        const plotNos = req.plots.map(p => p.plot_no);
        const mouzaLgd = req.plots[0].mouza_lgd; 
        
        const hasDuplicates = await this.repo.checkDuplicatePlots(plotNos, mouzaLgd);
        if (hasDuplicates) {
          return Result.fail('One or more requested plots have already been acquired or are in an active proposal. Hard Stop.');
        }
      }

      // 3. Prepare Domain Objects
      const proposalData: ProposalDTO = {
        ...req.proposal,
        current_stage_cd: 'DOCKET_PREP', // Initial state
        overall_status: 'DRAFT'
      };

      // 4. Persist via Transaction (handled in repository)
      // Note: mapping plots and landTypes will be handled inside the repo transaction
      // since the repository needs to insert the proposal to get its ID, then insert plots, etc.
      const proposalId = await this.repo.createProposal({
        proposal: proposalData,
        plots: (req.plots || []) as any,
        landTypes: (req.landTypes || []) as any
      });

      return Result.ok(proposalId);
    } catch (error: any) {
      return Result.fail(error.message);
    }
  }
}
