import { IUseCase, Result, Ok, Fail } from '@/core'
import { IProposalRepository, IProposalQueryOptions } from '@/domain/entities/proposal'
import { IProjectRepository } from '@/domain/entities/project'
import { Proposal } from '@/domain/entities/proposal/Proposal'

export interface GetProposalsRequest extends IProposalQueryOptions {}

export class GetProposalsUseCase implements IUseCase<GetProposalsRequest, any[]> {
  constructor(
    private readonly proposalRepo: IProposalRepository,
    private readonly projectRepo: IProjectRepository
  ) {}

  async execute(request?: GetProposalsRequest): Promise<Result<any[]>> {
    try {
      const result = await this.proposalRepo.findAll(request)
      
      // Fetch projects to map project names (simple batching)
      const projectIds = [...new Set(result.data.map((p: Proposal) => p.projectId))]
      const projectMap = new Map<string, string>()
      
      for (const pid of projectIds) {
        const project = await this.projectRepo.findById(pid)
        if (project) {
          projectMap.set(pid, project.name)
        }
      }
      
      const dtos = result.data.map((p: Proposal) => {
        // Since findAll currently reconstitutes the entity with all plotIds, we can count them
        const itemSummary = p.plotIds ? {
          total: p.plotIds.length,
          annexure_a: 0, // Since we don't have the explicit plot tags mapped in the Proposal entity array yet
          annexure_b: 0, 
          annexure_c: 0
        } : { total: 0, annexure_a: 0, annexure_b: 0, annexure_c: 0 }

        return {
          id: p.id,
          schedule_code: p.scheduleCode.value,
          project_id: p.projectId.toString(),
          projectName: projectMap.get(p.projectId.toString()) || `Project ${p.projectId}`,
          acquisition_mode: p.acquisitionMode.value,
          state: p.state.value,
          proposal_title: p.proposalTitle,
          description: p.description,
          proposed_by: p.proposedBy,
          proposedByRole: p.proposedByRole,
          areaOffice: p.areaOffice,
          collieryCode: p.collieryCode,
          adjacentColliery: p.adjacentColliery,
          total_area_acres: p.totalArea.toDecimal().toString(),
          notificationDate: p.notificationDate,
          itemSummary,
          entryTs: p.createdAt,
        }
      })

      return Ok(dtos)
    } catch (error: any) {
      return Fail(String(error))
    }
  }
}
