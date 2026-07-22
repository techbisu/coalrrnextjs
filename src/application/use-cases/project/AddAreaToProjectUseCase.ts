import { UseCase } from '@/core/base/UseCase'
import { Result, Fail } from '@/core/result/Result'
import { ComplianceMonitorService } from '@/core/compliance/services/ComplianceMonitorService'

export interface AddAreaToProjectRequest {
  projectId: string
  proposedAreaAcres: string | number
  proposedBudgetINR: string | number
  proposedJobs: number
}

export interface AddAreaToProjectResponse {
  canProceed: boolean
  requiresFormXXII: boolean
  message: string
}

export class AddAreaToProjectUseCase implements UseCase<AddAreaToProjectRequest, AddAreaToProjectResponse> {
  constructor(
    private readonly complianceService: ComplianceMonitorService
  ) {}

  async execute(request: AddAreaToProjectRequest): Promise<Result<AddAreaToProjectResponse>> {
    const complianceResult = await this.complianceService.checkBaselineCompliance(
      request.projectId,
      request.proposedAreaAcres,
      request.proposedBudgetINR,
      request.proposedJobs
    )

    if (complianceResult.isFailure) {
      return Fail(complianceResult.error)
    }

    const { withinBaseline, overflow } = complianceResult.value

    if (withinBaseline) {
      return Result.ok({
        canProceed: true,
        requiresFormXXII: false,
        message: 'Proposed addition is within the approved project baseline limits.'
      })
    } else {
      return Result.ok({
        canProceed: false,
        requiresFormXXII: true,
        message: `Proposed addition breaches project baseline limits. A Form-XXII deviation approval is required. Reason: ${overflow?.reason || 'Limit exceeded'}`
      })
    }
  }
}
