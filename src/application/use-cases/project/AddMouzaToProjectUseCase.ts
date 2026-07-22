import { UseCase } from '@/core/base/UseCase'
import { Result, Fail } from '@/core/result/Result'
import { ComplianceMonitorService } from '@/core/compliance/services/ComplianceMonitorService'
import { IProjectRepository } from '@/domain/entities/project/ProjectRepository.interface'
import { EventBus } from '@/core/notifications/EventBus'

export interface AddMouzaToProjectRequest {
  projectId: string
  mouzaLgd: bigint
  userId: string
}

export interface AddMouzaToProjectResponse {
  success: boolean
  message: string
}

export class AddMouzaToProjectUseCase implements UseCase<AddMouzaToProjectRequest, AddMouzaToProjectResponse> {
  constructor(
    private readonly projectRepository: IProjectRepository,
    private readonly complianceService: ComplianceMonitorService
  ) {}

  async execute(request: AddMouzaToProjectRequest): Promise<Result<AddMouzaToProjectResponse>> {
    const project = await this.projectRepository.findById(request.projectId)
    if (!project) return Fail('Project not found')

    // For a baseline locked project, the mouza MUST be authorized in the approvals
    if (project.isLocked()) {
      const isAuthResult = await this.complianceService.checkMouzaAuthorized(request.projectId, request.mouzaLgd)
      if (isAuthResult.isFailure) return Fail(isAuthResult.error)
      
      const isAuthorized = isAuthResult.value
      if (!isAuthorized) {
        return Fail('Mouza is not authorized under any baseline approval. A Form-XXII deviation is required to add this Mouza.')
      }
    }

    // Since it's authorized (or project isn't locked yet), we can add it to the project mouzas mapping
    await this.projectRepository.updateProjectMouzas(request.projectId, [request.mouzaLgd])

    EventBus.publish({
      event_name: 'MOUZA_ADDED_TO_PROJECT',
      module: 'project-master',
      user_id: request.userId,
      entity_id: request.projectId,
      data: {
        mouzaLgd: request.mouzaLgd.toString()
      }
    })

    return Result.ok({
      success: true,
      message: 'Mouza successfully linked to the project.'
    })
  }
}
