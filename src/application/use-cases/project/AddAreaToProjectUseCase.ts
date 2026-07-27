import { IUseCase, Result, Fail, Ok } from '@/core'
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

export class AddAreaToProjectUseCase implements IUseCase<AddAreaToProjectRequest, AddAreaToProjectResponse> {
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
      return Fail(`Failed to check compliance: ${complianceResult.error}`)
    }

    const { withinBaseline, overflow } = complianceResult.value

    if (withinBaseline) {
      return Ok({
        canProceed: true,
        requiresFormXXII: false,
        message: 'Proposed addition is within the approved project baseline limits.'
      })
    } else {
      return Ok({
        canProceed: false,
        requiresFormXXII: true,
        message: `Proposed addition breaches project baseline limits. A Form-XXII deviation approval is required. Reason: ${overflow?.area || 'Limit exceeded'}`
      })
    }
  }
}
