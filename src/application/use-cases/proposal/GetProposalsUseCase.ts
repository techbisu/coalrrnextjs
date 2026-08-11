import { IUseCase, Result, Ok, Fail } from '@/core'
import { IProposalRepository, ProposalDTO } from '@/domain/entities/proposal';
import { IProjectRepository } from '@/domain/entities/project'

export interface GetProposalsRequest {
  filter?: any;
  scope?: any;
  userId?: string;
  userName?: string;
}

export class GetProposalsUseCase implements IUseCase<GetProposalsRequest, any[]> {
  constructor(
    private readonly proposalRepo: IProposalRepository,
    private readonly projectRepo: IProjectRepository
  ) {}

  async execute(request?: GetProposalsRequest): Promise<Result<any[]>> {
    try {
      const scopeArg = request?.scope || request?.filter
      const userContext = { userId: request?.userId, userName: request?.userName }
      const proposals = await (this.proposalRepo as any).getAllProposals(scopeArg, userContext)
      
      const dtos = proposals.map(p => {
        let total = 0
        let a = 0
        let b = 0
        let c = 0
        let totalArea = 0

        const plots = p.plot_schedule || []
        for (const plot of plots) {
          total++
          totalArea += Number(plot.to_be_acquired_area) || 0

          let tag = 'A'
          if (plot.acq_status === 'PURCHASED') {
            tag = 'B'
          } else if (plot.acq_status === 'PARTIALLY_PURCHASED') {
            tag = 'C'
          } else {
            const landTypes = plot.plot_schedule_land_type || []
            const landType = landTypes[0]?.landtype_master?.land_type || ''
            if (landType.toLowerCase().includes('govt')) {
              tag = 'A'
            } else {
              tag = 'A' // Default clear land
            }
          }

          if (tag === 'A') a++
          if (tag === 'B') b++
          if (tag === 'C') c++
        }

        return {
          id: p.proposal_id,
          schedule_code: p.proposal_no,
          project_id: p.proj_cd,
          projectName: p.project?.projNm || `Project ${p.proj_cd}`,
          ecl_proj_cd: p.project?.eclProjCd || null,
          acq_mode_id: Number(p.acq_mode_id),
          state: p.overall_status,
          proposal_title: p.proposal_no,
          description: p.purpose_justification,
          proposed_by: p.entry_by,
          proposedByRole: 'Initiator',
          areaOffice: p.area_cd,
          collieryCode: p.mine_cd,
          adjacentColliery: '', // or a fetched value if available
          total_area_acres: totalArea.toString(),
          notificationDate: p.proposal_dt,
          itemSummary: { total, annexure_a: a, annexure_b: b, annexure_c: c },
          entryTs: p.proposal_dt, // using proposal_dt as entry timestamp fallback
        }
      })

      return Ok(dtos)
    } catch (error: any) {
      return Fail(String(error))
    }
  }
}
