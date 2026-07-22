import { IUseCase } from '@/core'
import { Result, Fail } from '@/core/result/Result'
import { ComplianceMonitorService } from '@/core/compliance/services/ComplianceMonitorService'
import { IProjectRepository } from '@/domain/entities/project/ProjectRepository.interface'
import { Area } from '@/domain/value-objects/Area'
import { Money } from '@/domain/value-objects/Money'

export interface GenerateFormXXIIRequest {
  projectId: string
  proposedAreaAcres: string | number
  proposedBudgetINR: string | number
  proposedJobs: number
  landClassBreakup?: any
}

export interface GenerateFormXXIIResponse {
  projectId: string
  projectName: string
  currentApprovedArea: string
  proposedArea: string
  resultingArea: string
  isBaselineBreached: boolean
  draftDeviationData: {
    deviationArea: string
    deviationBudget: string
    deviationJobs: number
    landClassBreakup: any
    justificationText: string // To be filled by Area Land Cell
  }
}

export class GenerateFormXXIIUseCase implements IUseCase<GenerateFormXXIIRequest, GenerateFormXXIIResponse> {
  constructor(
    private readonly projectRepo: IProjectRepository,
    private readonly complianceService: ComplianceMonitorService
  ) {}

  async execute(request: GenerateFormXXIIRequest): Promise<Result<GenerateFormXXIIResponse>> {
    const project = await this.projectRepo.findById(request.projectId)
    if (!project) return Fail('Project not found')

    const complianceResult = await this.complianceService.checkBaselineCompliance(
      request.projectId,
      request.proposedAreaAcres,
      request.proposedBudgetINR,
      request.proposedJobs
    )

    if (complianceResult.isFailure) {
      return Fail(complianceResult.error)
    }

    const { withinBaseline } = complianceResult.value

    const proposedArea = Area.tryCreate(request.proposedAreaAcres, 'ACRES')
    if (proposedArea.isFailure) return Fail('Invalid area')
    const proposedAreaVal = (proposedArea as any).value
    
    const resultingArea = project.totalAcquiredArea.add(proposedAreaVal)

    // Draft deviation data
    // If it's breached, deviation is resulting - approved. Otherwise 0.
    let deviationArea = '0'
    if (!withinBaseline && resultingArea.isGreaterThan(project.totalApprovedArea)) {
      // Need a subtract method or just do it via decimal
      const dev = resultingArea.toDecimal().minus(project.totalApprovedArea.toDecimal())
      deviationArea = dev.toString()
    }

    return Result.ok({
      projectId: project.id,
      projectName: project.projNm,
      currentApprovedArea: project.totalApprovedArea.toDecimal().toString(),
      proposedArea: proposedAreaVal.toDecimal().toString(),
      resultingArea: resultingArea.toDecimal().toString(),
      isBaselineBreached: !withinBaseline,
      draftDeviationData: {
        deviationArea,
        deviationBudget: '0', // Similar logic for budget
        deviationJobs: 0,
        landClassBreakup: request.landClassBreakup || {},
        justificationText: '' // Placeholder for user input
      }
    })
  }
}
