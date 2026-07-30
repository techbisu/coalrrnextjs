import { Proposal } from './Proposal';

export interface ProposalDTO {
  proposal_id?: string;
  proposal_no: string;
  proposal_dt: Date;
  mine_cd: string;
  area_cd: string;
  proj_cd: string;
  acq_mode_id: number;
  purpose_justification: string;
  pr_scheme_ref_no?: string;
  is_within_pr_limit: boolean;
  cmd_admin_approval_ref?: string;
  requires_board_approval: boolean;
  total_land_cost_est?: number;
  total_rehab_cost_est?: number;
  total_employment_cost_est?: number;
  revenue_plan_doc_id?: string;
  current_stage_cd: string;
  overall_status: string;
  tot_acq_area?: number;
  tot_aprv_area?: number;
  entry_by: string;
}

export interface PlotScheduleDTO {
  schedule_id?: string;
  proposal_id: string;
  plot_no: string;
  plot_ty?: string;
  plot_number?: string;
  bata_no?: string | null;
  opt_plot_ty?: string | null;
  opt_plot?: string | null;
  opt_bata?: string | null;
  mouza_lgd: number;
  jl_no?: string;
  total_ror_area: number;
  to_be_acquired_area: number;
  acq_status: string;
  remarks?: string;
  entry_by: string;
  district_lgd?: number;
  state_lgd?: number;
  block_lgd?: number;
  ps_lgd?: number;
}

export interface PlotScheduleLandTypeDTO {
  schedule_land_type_id?: string;
  schedule_id: string;
  landt_id: number;
  area: number;
  area_to_acquire: number;
  area_acquired?: number;
}

export interface IProposalRepository {
  // --- DDD Interface ---
  findById(id: string): Promise<Proposal | null>;
  save(proposal: Proposal): Promise<void>;
  
  isPlotInActiveProposal(plotId: string, excludeProposalId?: string): Promise<boolean>;
  addPlotToProposal(proposalId: string, plotId: string, annexureTag: string): Promise<void>;
  updatePlotAnnexure(proposalId: string, plotId: string, annexureTag: string): Promise<void>;
  removePlotFromProposal(proposalId: string, plotId: string): Promise<void>;

  // --- DTO Procedural Interface (Hybrid for now) ---
  createProposal(data: {
    proposal: ProposalDTO;
    plots: PlotScheduleDTO[];
    landTypes: PlotScheduleLandTypeDTO[];
  }): Promise<string>;
  
  getProposalById(proposalId: string): Promise<ProposalDTO | null>;
  getAllProposals(): Promise<any[]>;
  getPlotsByProposalId(proposalId: string): Promise<PlotScheduleDTO[]>;
  getLandTypesByScheduleId(scheduleId: string): Promise<PlotScheduleLandTypeDTO[]>;
  
  checkDuplicatePlots(plotNos: string[], mouzaLgd: number, excludeProposalId?: string): Promise<boolean>;
  getProposalDetailsWithPlots(proposalId: string): Promise<any>;

  addPlots(proposalId: string, plots: PlotScheduleDTO[], landTypes: PlotScheduleLandTypeDTO[]): Promise<void>;
  updatePlot(proposalId: string, plotNo: string, plotData: PlotScheduleDTO, landTypesData: PlotScheduleLandTypeDTO[]): Promise<void>;
  deletePlot(proposalId: string, plotNo: string): Promise<void>;
}
