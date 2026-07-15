/**
 * Proposal Repository Interface - Contract for proposal persistence.
 * Defined in the domain layer, implemented in infrastructure layer.
 */
import { Proposal } from './Proposal'
import { IPaginatedResult, IQueryOptions } from '@/core/interfaces'

export interface IProposalRepository {
  findById(id: string): Promise<Proposal | null>
  findAll(options?: IQueryOptions): Promise<IPaginatedResult<Proposal>>
  findByScheduleCode(schedule_code: string): Promise<Proposal | null>
  findByProjectId(project_id: string, options?: IQueryOptions): Promise<IPaginatedResult<Proposal>>
  save(proposal: Proposal): Promise<void>
  delete(id: string): Promise<void>
  exists(id: string): Promise<boolean>
  
  // Plot association methods (handling the many-to-many relationship)
  addPlotToProposal(proposalId: string, plot_id: string, annexure_tag: 'A' | 'B' | 'C'): Promise<void>
  removePlotFromProposal(proposalId: string, plot_id: string): Promise<void>
  updatePlotAnnexure(proposalId: string, plot_id: string, annexure_tag: 'A' | 'B' | 'C'): Promise<void>
  isPlotInActiveProposal(plot_id: string, currentProposalId?: string): Promise<boolean>
}

export interface IProposalQueryOptions extends IQueryOptions {
  project_id?: string
  state?: string
  acquisition_mode?: string
  mine_cd?: string
  search?: string
}
