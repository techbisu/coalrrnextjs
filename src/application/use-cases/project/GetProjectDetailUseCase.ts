import { IUseCase, Result, Fail, Ok } from '@/core'
import { IProjectRepository } from '@/domain/entities/project/ProjectRepository.interface'

export interface GetProjectDetailRequest {
  projectId: string
}

export interface GetProjectDetailResponse {
  id: string
  name: string
  eclProjCd: string | null
  status: number
  lockedAt: string | null
  totalApprovedArea: string
  landBudget: string
  rrBudget: string
  totalEmpSanctioned: number
  mineCds: string[]
}

export class GetProjectDetailUseCase implements IUseCase<GetProjectDetailRequest, GetProjectDetailResponse> {
  constructor(private readonly projectRepository: IProjectRepository) {}

  async execute(request: GetProjectDetailRequest): Promise<Result<GetProjectDetailResponse>> {
    const project = await this.projectRepository.findById(request.projectId)
    
    if (!project) {
      return Fail('Project not found')
    }

    const response: GetProjectDetailResponse = {
      id: project.id,
      name: project.projNm,
      eclProjCd: project.eclProjCd ?? null,
      status: project.status,
      lockedAt: project.locked_at ? project.locked_at.toISOString() : null,
      totalApprovedArea: project.totalApprovedArea.toDecimal().toString(),
      landBudget: project.landBudget.toDecimal().toString(),
      rrBudget: project.rrBudget.toDecimal().toString(),
      totalEmpSanctioned: project.totalEmpSanctioned,
      mineCds: project.mineCds ?? [],
    }

    return Ok(response)
  }
}
