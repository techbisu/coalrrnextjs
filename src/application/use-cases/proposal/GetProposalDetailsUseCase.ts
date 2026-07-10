/**
 * Get Proposal Details Use Case - Data retrieval for the UI.
 */
import { IUseCase, Result, Fail, Ok } from '@/core'
import { PrismaProposalRepository } from '@/infrastructure/persistence/repositories/PrismaProposalRepository'
import { NotFoundException } from '@/core/errors'

export interface GetProposalDetailsRequest {
  proposalId: string
}

// Complex DTO for the UI
export interface GetProposalDetailsResponse {
  id: string
  schedule_code: string
  project_id: string
  projectName: string
  projectBudgetCeiling: string
  projectLandLimit: string
  acquisition_mode: string
  state: string
  proposal_title: string
  description: string
  proposed_by: string
  proposed_by_role: string
  area_office: string
  colliery_code: string
  adjacent_colliery: string
  total_area_acres: string
  notification_date: string | null
  mode_specific_checklist: string
  items: Array<{
    id: string
    plot_id: string
    plot_number: string
    mouza: string
    land_type: string
    area_acres: string
    annexure_tag: string
    is_active: boolean
  }>
  entry_ts: string
}

export class GetProposalDetailsUseCase implements IUseCase<GetProposalDetailsRequest, GetProposalDetailsResponse> {
  // Injecting the concrete Prisma repository because this use case is read-heavy 
  // and requires specific joins for UI aggregation, which is fine in CQRS.
  constructor(
    private readonly proposalRepository: PrismaProposalRepository
  ) {}

  async execute(request: GetProposalDetailsRequest): Promise<Result<GetProposalDetailsResponse>> {
    const data = await this.proposalRepository.getProposalDetailsWithPlots(request.proposalId)
    
    if (!data) {
      return Fail('Proposal')
    }

    // Map to DTO
    const response: GetProposalDetailsResponse = {
      id: data.id,
      schedule_code: data.schedule_code,
      project_id: data.project_id,
      projectName: data.project.name,
      projectBudgetCeiling: data.project.total_budget_ceiling.toString(),
      projectLandLimit: data.project.total_land_limit_acres.toString(),
      acquisition_mode: data.acquisition_mode,
      state: data.state,
      proposal_title: data.proposal_title ?? '',
      description: data.description ?? '',
      proposed_by: data.proposed_by ?? '',
      proposed_by_role: data.proposed_by_role ?? '',
      area_office: data.area_office ?? '',
      colliery_code: data.colliery_code ?? '',
      adjacent_colliery: data.adjacent_colliery ?? '',
      total_area_acres: data.total_area_acres.toString(),
      notification_date: data.notification_date ? data.notification_date.toISOString() : null,
      mode_specific_checklist: data.mode_specific_checklist ?? '{"items":[]}',
      items: data.items.map((it: any) => ({ 
        id: it.id, 
        plot_id: it.plot_id, 
        plot_number: it.plot.plot_number, 
        mouza: it.plot.mouza?.name || 'Unknown', 
        land_type: it.plot.land_type, 
        area_acres: it.plot.area_acres.toString(), 
        annexure_tag: it.annexure_tag, 
        is_active: it.is_active 
      })),
      entry_ts: data.entry_ts.toISOString(),
    }

    return Ok(response)
  }
}
