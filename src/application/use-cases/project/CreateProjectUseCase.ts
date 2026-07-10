/**
 * Create Project Use Case - Application service for creating new projects.
 * Orchestrates validation, persistence, and event publishing.
 */
import { IUseCase, Result, Fail } from '@/core'
import { Project, IProjectRepository } from '@/domain'
import { EventBus } from '@/core/notifications/EventBus'
import { auditQueue as AuditQueue } from '@/infrastructure/di/Container'

export interface CreateProjectRequest {
  name: string
  colliery_code: string
  total_land_limit_acres: number | string
  total_budget_ceiling: number | string
  total_employment_quota: number
  boundary?: string
  user_id: string
}

export interface CreateProjectResponse {
  id: string
  name: string
  colliery_code: string
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
      colliery_code: request.colliery_code,
      total_land_limit_acres: request.total_land_limit_acres,
      total_budget_ceiling: request.total_budget_ceiling,
      total_employment_quota: request.total_employment_quota,
      boundary: request.boundary,
    })

    if (projectResult.isFailure) {
      return Fail(String(projectResult.error!))
    }

    const project = projectResult.value

    // 2. Persist
    await this.projectRepository.save(project)

    // 3. Publish events
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

    // 4. Audit logging
    AuditQueue.push({
      event_type: 'CREATE_PROJECT',
      module_name: 'project-master',
      entity_name: 'mst_project',
      entity_id: project.id.toString(),
      user_id: request.user_id,
      remarks: JSON.stringify({
        name: project.name,
        colliery_code: project.colliery_code,
      }),
    })

    // 5. Return response
    return {
      isSuccess: true,
      isFailure: false,
      value: {
        id: project.id.toString(),
        name: project.name,
        colliery_code: project.colliery_code,
        message: `Project "${project.name}" created successfully.`,
      },
      error: null,
    }
  }
}
