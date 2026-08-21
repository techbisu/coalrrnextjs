/**
 * Delete Project Use Case - Application service for deleting projects.
 * Orchestrates validation, persistence, and event publishing.
 */
import { IUseCase, Result, Fail, Ok } from '@/core'
import { IProjectRepository } from '@/domain'
import { EventBus } from '@/core/notifications/EventBus'
import { auditQueue as AuditQueue } from '@/infrastructure/di/modules/core.di'

export interface DeleteProjectRequest {
  id: string
  user_id: string
}

export interface DeleteProjectResponse {
  id: string
  message: string
}

export class DeleteProjectUseCase implements IUseCase<DeleteProjectRequest, DeleteProjectResponse> {
  constructor(
    private readonly projectRepository: IProjectRepository
  ) {}

  async execute(request: DeleteProjectRequest): Promise<Result<DeleteProjectResponse>> {
    // 1. Fetch domain entity to check if it exists and is locked
    const project = await this.projectRepository.findById(request.id)

    if (!project) {
      return Fail('Project not found')
    }

    if (project.isLocked()) {
      return Fail('Cannot delete a locked baseline project')
    }

    // 2. Delete
    await this.projectRepository.delete(request.id)

    // 3. Publish events
    await EventBus.publish({
      event_name: 'PROJECT_DELETED',
      module: 'project-master',
      user_id: request.user_id,
      entity_id: request.id,
      data: { id: request.id, name: project.projNm },
    })

    // 4. Audit logging
    AuditQueue.push({
      event_type: 'DELETE_PROJECT',
      module_name: 'project-master',
      entity_name: 'mst_project',
      entity_id: request.id,
      user_id: request.user_id,
      remarks: `Deleted Project: ${project.projNm}`,
    })

    // 6. Return response
    return Ok({
      id: request.id,
      message: `Project "${project.projNm}" deleted successfully.`,
    })
  }
}
