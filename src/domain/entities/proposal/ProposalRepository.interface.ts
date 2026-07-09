/**
 * Proposal Repository Interface - Contract for proposal persistence.
 * Defined in the domain layer, implemented in infrastructure layer.
 */
import { Proposal } from './Proposal'
import { IPaginatedResult, IQueryOptions } from '@/core/interfaces'

export interface IProposalRepository {
  findById(id: string): Promise<Proposal | null>
  findAll(options?: IQueryOptions): Promise<IPaginatedResult<Proposal>>
  findByScheduleCode(scheduleCode: string): Promise<Proposal | null>
  findByProjectId(projectId: string, options?: IQueryOptions): Promise<IPaginatedResult<Proposal>>
  save(proposal: Proposal): Promise<void>
  delete(id: string): Promise<void>
  exists(id: string): Promise<boolean>
  
  // Plot association methods (handling the many-to-many relationship)
  addPlotToProposal(proposalId: string, plotId: string, annexureTag: 'A' | 'B' | 'C'): Promise<void>
  removePlotFromProposal(proposalId: string, plotId: string): Promise<void>
  updatePlotAnnexure(proposalId: string, plotId: string, annexureTag: 'A' | 'B' | 'C'): Promise<void>
  isPlotInActiveProposal(plotId: string, currentProposalId?: string): Promise<boolean>
}

export interface IProposalQueryOptions extends IQueryOptions {
  projectId?: string
  state?: string
  acquisitionMode?: string
  collieryCode?: string
  search?: string
}
