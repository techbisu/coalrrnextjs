/**
 * Update Project Use Case - Application service for updating existing projects.
 * Orchestrates validation, persistence, and event publishing.
 */
import { IUseCase, Result, Fail, Ok } from '@/core'
import { IProjectRepository } from '@/domain'
import { EventBus } from '@/core/notifications/EventBus'
import { auditQueue as AuditQueue } from '@/infrastructure/di/Container'
import { NotFoundException } from '@/core/errors'
import { ProjectAlreadyLockedException } from '@/domain'

export interface UpdateProjectRequest {
  id: string
  name?: string
  mine_cd?: string
  area_cd?: string
  state_lgd?: bigint
  pr_doc_id?: string | null
  mouza_lgds?: bigint[]
  total_land_limit_acres?: number | string
  total_budget_ceiling?: number | string
  total_employment_quota?: number
  boundary?: string
  statutory_clearances?: any
  user_id: string
}

export interface UpdateProjectResponse {
  id: string
  name: string
  message: string
}

export class UpdateProjectUseCase implements IUseCase<UpdateProjectRequest, UpdateProjectResponse> {
  constructor(
    private readonly projectRepository: IProjectRepository
  ) {}

  async execute(request: UpdateProjectRequest): Promise<Result<UpdateProjectResponse>> {
    // 1. Fetch domain entity
    const project = await this.projectRepository.findById(request.id)

    if (!project) {
      return Fail('Project not found')
    }

    if (project.isLocked()) {
      return Fail('Cannot edit a locked baseline')
    }

    // 2. Update entity properties
    const updateProps = {
      name: request.name,
      mine_cd: request.mine_cd,
      totalApprovedArea: request.total_land_limit_acres?.toString(),
      landBudget: request.land_budget?.toString(),
      rrBudget: request.rr_budget?.toString(),
      totalEmpSanctioned: request.total_employment_quota,
      area_cd: request.area_cd,
      state_lgd: request.state_lgd,
      pr_doc_id: request.pr_doc_id ?? undefined,
      boundary: request.boundary,
      statutory_clearances: request.statutory_clearances
    }
    
    // We clean up undefined properties
    Object.keys(updateProps).forEach(key => 
      updateProps[key as keyof typeof updateProps] === undefined && delete updateProps[key as keyof typeof updateProps]
    )

    const updateResult = project.update(updateProps, request.user_id)
    if (updateResult.isFailure) {
        return Fail(String(updateResult.error!))
    }

    // 3. Persist
    await this.projectRepository.save(project)

    if (request.mouza_lgds !== undefined) {
      await this.projectRepository.updateProjectMouzas(project.id.toString(), request.mouza_lgds)
    }

    // Sync file attachments if pr_doc_id is explicitly provided in the update payload
    if (request.pr_doc_id !== undefined) {
      const fileIds = request.pr_doc_id ? [request.pr_doc_id] : []
      await (this.projectRepository as any).syncProjectDocuments(project.id.toString(), fileIds, request.user_id)
    }

    // 4. Publish events
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
      event_type: 'UPDATE_PROJECT',
      entity_name: 'mst_project',
      entity_id: project.id.toString(),
      user_id: request.user_id,
      remarks: JSON.stringify(updateProps),
    })

    // 6. Return response
    return Ok({
        id: project.id.toString(),
        name: project.name,
        message: 'Project updated successfully.',
    })
  }
}
