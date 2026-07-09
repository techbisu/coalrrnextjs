/**
 * Create Project Use Case - Application service for creating new projects.
 * Orchestrates validation, persistence, and event publishing.
 */
import { IUseCase, Result, Fail } from '@/core'
import { Project, IProjectRepository } from '@/domain'
import { EventBus } from '@/notifications/EventBus'
import { AuditQueue } from '@/audit/services/AuditQueue'

export interface CreateProjectRequest {
  name: string
  collieryCode: string
  totalLandLimitAcres: number | string
  totalBudgetCeiling: number | string
  totalEmploymentQuota: number
  boundary?: string
  userId: string
}

export interface CreateProjectResponse {
  id: string
  name: string
  collieryCode: string
  message: string
}

export class CreateProjectUseCase implements IUseCase<CreateProjectRequest, CreateProjectResponse> {
  constructor(
    private readonly projectRepository: IProjectRepository
  ) {}

  async execute(request: CreateProjectRequest): Promise<Result<CreateProjectResponse>> {
    // 1. Validate and create domain entity
    const projectResult = Project.create({
      name: request.name,
      collieryCode: request.collieryCode,
      totalLandLimitAcres: request.totalLandLimitAcres,
      totalBudgetCeiling: request.totalBudgetCeiling,
      totalEmploymentQuota: request.totalEmploymentQuota,
      boundary: request.boundary,
    })

    if (projectResult.isFailure) {
      return Fail(projectResult.error!)
    }

    const project = projectResult.value

    // 2. Persist
    await this.projectRepository.save(project)

    // 3. Publish events
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

    // 4. Audit logging
    AuditQueue.push({
      action: 'CREATE_PROJECT',
      entityType: 'MstProject',
      entityId: project.id,
      userId: request.userId,
      details: JSON.stringify({
        name: project.name,
        collieryCode: project.collieryCode,
      }),
    })

    // 5. Return response
    return {
      isSuccess: true,
      isFailure: false,
      value: {
        id: project.id,
        name: project.name,
        collieryCode: project.collieryCode,
        message: `Project "${project.name}" created successfully.`,
      },
      error: null,
    }
  }
}
