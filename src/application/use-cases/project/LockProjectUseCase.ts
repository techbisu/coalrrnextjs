/**
 * Lock Project Use Case - Application service for locking project baselines.
 * Once locked, a project cannot be modified (immutable baseline for audits).
 */
import { IUseCase, Result, Fail } from '@/core'
import { Project, ProjectAlreadyLockedException, IProjectRepository } from '@/domain'
import { EventBus } from '@/core/notifications/EventBus'
import { auditQueue as AuditQueue } from '@/infrastructure/di/Container'
import { NotFoundException } from '@/core/errors'

export interface LockProjectRequest {
  project_id: string
  user_id: string
}

export interface LockProjectResponse {
  id: string
  name: string
  locked_at: Date
  message: string
}

export class LockProjectUseCase implements IUseCase<LockProjectRequest, LockProjectResponse> {
  constructor(
    private readonly projectRepository: IProjectRepository
  ) {}

  async execute(request: LockProjectRequest): Promise<Result<LockProjectResponse>> {
    // 1. Find project
    const project = await this.projectRepository.findById(request.project_id)
    
    if (!project) {
      return Fail('Project')
    }

    // 2. Execute business behavior
    const lockResult = project.lock(request.user_id)
    
    if (lockResult.isFailure) {
      return Fail(String(lockResult.error!))
    }

    // 3. Persist the change
    await this.projectRepository.lock(request.project_id, request.user_id)

    // 4. Publish domain events
    const domainEvents = project.clearDomainEvents()
    for (const event of domainEvents) {
      EventBus.publish({
        event_name: event.event_type,
        module: 'project-master',
        user_id: request.user_id,
        entity_id: event.aggregateId,
        data: event.payload,
      })
    }

    // 5. Audit logging
    AuditQueue.push({
      event_type: 'LOCK_PROJECT_BASELINE',
      entity_name: 'mst_project',
      entity_id: project.id,
      user_id: request.user_id,
      remarks: 'Baseline permanently locked.',
    })

    // 6. Return response
    return {
      isSuccess: true,
      isFailure: false,
      value: {
        id: project.id,
        name: project.name,
        locked_at: project.locked_at!,
        message: `Project "${project.name}" has been locked as baseline.`,
      },
      error: null,
    }
  }
}
