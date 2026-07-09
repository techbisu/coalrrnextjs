/**
 * Lock Project Use Case - Application service for locking project baselines.
 * Once locked, a project cannot be modified (immutable baseline for audits).
 */
import { IUseCase, Result, Fail } from '@/core'
import { Project, ProjectAlreadyLockedException, IProjectRepository } from '@/domain'
import { EventBus } from '@/notifications/EventBus'
import { AuditQueue } from '@/audit/services/AuditQueue'
import { NotFoundException } from '@/core/errors'

export interface LockProjectRequest {
  projectId: string
  userId: string
}

export interface LockProjectResponse {
  id: string
  name: string
  lockedAt: Date
  message: string
}

export class LockProjectUseCase implements IUseCase<LockProjectRequest, LockProjectResponse> {
  constructor(
    private readonly projectRepository: IProjectRepository
  ) {}

  async execute(request: LockProjectRequest): Promise<Result<LockProjectResponse>> {
    // 1. Find project
    const project = await this.projectRepository.findById(request.projectId)
    
    if (!project) {
      return Fail(new NotFoundException('Project', request.projectId))
    }

    // 2. Execute business behavior
    const lockResult = project.lock(request.userId)
    
    if (lockResult.isFailure) {
      return Fail(lockResult.error!)
    }

    // 3. Persist the change
    await this.projectRepository.lock(request.projectId, request.userId)

    // 4. Publish domain events
    const domainEvents = project.clearDomainEvents()
    for (const event of domainEvents) {
      EventBus.publish({
        eventName: event.eventType,
        module: 'project-master',
        userId: request.userId,
        entityId: event.aggregateId,
        data: event.payload,
      })
    }

    // 5. Audit logging
    AuditQueue.push({
      action: 'LOCK_PROJECT_BASELINE',
      entityType: 'MstProject',
      entityId: project.id,
      userId: request.userId,
      details: 'Baseline permanently locked.',
    })

    // 6. Return response
    return {
      isSuccess: true,
      isFailure: false,
      value: {
        id: project.id,
        name: project.name,
        lockedAt: project.lockedAt!,
        message: `Project "${project.name}" has been locked as baseline.`,
      },
      error: null,
    }
  }
}
