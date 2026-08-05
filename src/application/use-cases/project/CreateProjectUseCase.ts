/**
 * Create Project Use Case - Application service for creating new projects.
 * Orchestrates validation, persistence, and event publishing.
 */
import { IUseCase, Result, Fail } from '@/core'
import { Project, IProjectRepository } from '@/domain'
import { EventBus } from '@/core/notifications/EventBus'
import { auditQueue as AuditQueue } from '@/infrastructure/di/modules/core.di'

export interface CreateProjectRequest {
  proj_cd?: string
  ecl_proj_cd?: string
  name?: string
  proj_nm?: string
  mine_cd?: string
  mine_cds?: string[]
  area_cd?: string
  state_lgd?: bigint | string | number
  pr_doc_id?: string | null
  district_lgd?: bigint | string | number
  block_lgds?: string[]
  mouza_lgds?: (bigint | string | number)[]
  total_land_limit_acres?: number | string
  approved_tenancy_area?: number
  approved_govt_area?: number
  approved_patta_area?: number
  approved_forest_area?: number
  approved_excavation_area?: number
  approved_safety_zone_area?: number
  approved_ob_dump_area?: number
  approved_infra_area?: number
  approved_diversion_area?: number
  approved_rehab_area?: number
  is_combo_project?: boolean
  linked_mine_codes?: string[]
  land_budget?: number | string
  rr_budget?: number | string
  total_employment_quota?: number
  sanctioned_employment_count?: number
  boundary?: string
  user_id: string
}

export interface CreateProjectResponse {
  id: string
  name: string
  mine_cds?: string[]
  message: string
}

export class CreateProjectUseCase implements IUseCase<CreateProjectRequest, CreateProjectResponse> {
  constructor(
    private readonly projectRepository: IProjectRepository
  ) {}

  async execute(request: CreateProjectRequest): Promise<Result<CreateProjectResponse>> {
    const areaCd = request.area_cd || 'DEFAULT'
    const projName = request.proj_nm || request.name || 'Unnamed Project'
    const mineCdsList = request.mine_cds || (request.mine_cd ? [request.mine_cd] : ['MINE'])
    const primaryMineCd = mineCdsList[0] || 'MINE'

    // Calculate total_land_limit_acres if not provided directly
    const computedTotalLand = request.total_land_limit_acres
      ? Number(request.total_land_limit_acres)
      : (request.approved_tenancy_area || 0) + (request.approved_govt_area || 0) + (request.approved_forest_area || 0) + (request.approved_patta_area || 0)

    const empQuota = request.total_employment_quota || request.sanctioned_employment_count || 0

    // Auto-generate project codes if missing
    const generatedCodes = await (this.projectRepository as any).generateProjectCodes(
      areaCd,
      primaryMineCd,
      request.state_lgd
    )

    const finalProjCd = request.proj_cd && request.proj_cd.trim() !== '' ? request.proj_cd : generatedCodes.proj_cd
    const finalEclProjCd = request.ecl_proj_cd && request.ecl_proj_cd.trim() !== '' ? request.ecl_proj_cd : generatedCodes.ecl_proj_cd
    const finalStateLgd = request.state_lgd ? BigInt(request.state_lgd.toString()) : BigInt(generatedCodes.state_lgd)

    // Validate and create domain entity
    const projectResult = Project.create({
      projCd: finalProjCd,
      projNm: projName,
      eclProjCd: finalEclProjCd,
      mine_cds: mineCdsList,
      area_cd: request.area_cd,
      totalApprovedArea: computedTotalLand.toString(),
      approved_tenancy_area: request.approved_tenancy_area,
      approved_govt_area: request.approved_govt_area,
      approved_patta_area: request.approved_patta_area,
      approved_forest_area: request.approved_forest_area,
      approved_excavation_area: request.approved_excavation_area,
      approved_safety_zone_area: request.approved_safety_zone_area,
      approved_ob_dump_area: request.approved_ob_dump_area,
      approved_infra_area: request.approved_infra_area,
      approved_diversion_area: request.approved_diversion_area,
      approved_rehab_area: request.approved_rehab_area,
      is_combo_project: request.is_combo_project,
      linked_mine_codes: request.linked_mine_codes,
      landBudget: request.land_budget?.toString() || '0',
      rrBudget: request.rr_budget?.toString() || '0',
      totalEmpSanctioned: empQuota,
      tenantId: 'ecl',
      state_lgd: finalStateLgd,
      district_lgd: request.district_lgd !== undefined ? Number(request.district_lgd) : undefined,
      block_lgds: request.block_lgds ? request.block_lgds.map(String) : [],
      mouza_lgds: request.mouza_lgds ? request.mouza_lgds.map(String) : [],
      pr_doc_id: request.pr_doc_id ?? undefined,
      total_land_limit_acres: computedTotalLand,
      total_employment_quota: empQuota,
      boundary: request.boundary,
    })

    if (projectResult.isFailure) {
      return Fail(String(projectResult.error!))
    }

    const project = projectResult.value

    // 2. Persist
    await this.projectRepository.save(project)
    // Always sync project locations (this also creates the baseline ProjAprv if missing)
    await this.projectRepository.updateProjectLocations(
      project.id.toString(), 
      project.mineCds,
      request.mouza_lgds ? request.mouza_lgds.map(String) : [],
      request.district_lgd ? String(request.district_lgd) : undefined,
      request.block_lgds ? request.block_lgds.map(String) : []
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
      remarks: `Created Project: ${project.projNm}`,
    })

    // 5. Return response
    return {
      isSuccess: true,
      isFailure: false,
      value: {
        id: project.id.toString(),
        name: project.projNm,
        mine_cds: project.mineCds,
        message: `Project "${project.projNm}" created successfully.`,
      },
      error: null,
    }
  }
}
