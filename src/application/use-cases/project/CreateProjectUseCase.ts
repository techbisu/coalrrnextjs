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
  mine_cd: string
  area_cd?: string
  state_lgd?: bigint
  pr_doc_id?: string | null
  mouza_lgds?: bigint[]
  total_land_limit_acres: number | string
  total_budget_ceiling: number | string
  total_employment_quota: number
  boundary?: string
  user_id: string
}

export interface CreateProjectResponse {
  id: string
  name: string
  mine_cd: string
  message: string
}

export class CreateProjectUseCase implements IUseCase<CreateProjectRequest, CreateProjectResponse> {
  constructor(
    private readonly projectRepository: IProjectRepository
  ) {}

  async execute(request: CreateProjectRequest): Promise<Result<CreateProjectResponse>> {
    // 1. Generate ECL Project Code
    const eclProjCd = await this.projectRepository.generateEclProjCd(request.area_cd, request.mine_cd)

    // 2. Validate and create domain entity
    const projectResult = Project.create({
      name: request.name,
      eclProjCd,
      mine_cd: request.mine_cd,
      area_cd: request.area_cd,
      totalApprovedArea: request.total_land_limit_acres?.toString() || '0',
      landBudget: request.land_budget?.toString() || '0',
      rrBudget: request.rr_budget?.toString() || '0',
      totalEmpSanctioned: request.total_employment_quota || 0,
      tenantId: 'ecl',
      state_lgd: request.state_lgd,
      pr_doc_id: request.pr_doc_id,
      total_land_limit_acres: request.total_land_limit_acres,
      total_budget_ceiling: request.total_budget_ceiling,
      total_employment_quota: request.total_employment_quota,
      boundary: request.boundary,
    })

    if (projectResult.isFailure) {
      return Fail(String(projectResult.error!))
    }

    const project = projectResult.value

    // 2. Persist (Repository should also handle mouza_lgds if needed in the future, 
    // but right now it's not strictly part of the Project aggregate root yet, we can do it via a service or repository update method)
    await this.projectRepository.save(project)
    // Always sync project mouzas (this also creates the baseline ProjAprv if missing)
    await this.projectRepository.updateProjectMouzas(
      project.id.toString(), 
      request.mouza_lgds || []
    )
    
    // Link the PR document in file_attachment if provided
    if (request.pr_doc_id) {
      await (this.projectRepository as any).syncProjectDocuments(project.id.toString(), [request.pr_doc_id], request.user_id)
    }


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
        mine_cd: project.mine_cd,
      }),
    })

    // 5. Return response
    return {
      isSuccess: true,
      isFailure: false,
      value: {
        id: project.id.toString(),
        name: project.name,
        mine_cd: project.mine_cd,
        message: `Project "${project.name}" created successfully.`,
      },
      error: null,
    }
  }
}
