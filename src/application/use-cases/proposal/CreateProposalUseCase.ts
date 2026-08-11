/**
 * Create Proposal Use Case - Application service for creating new land acquisition proposals.
 */
import { IUseCase, Result, Fail, Ok } from '@/core'
import { MODULE_CODES } from '@/core/config/module-codes.config'
import { Proposal, IProposalRepository } from '@/domain/entities/proposal'
import { IProjectRepository } from '@/domain/entities/project'
import { EventBus } from '@/core/notifications/EventBus'
import { auditQueue as AuditQueue } from '@/infrastructure/di/modules/core.di'
import { ValidationException, NotFoundException } from '@/core/errors'

export interface CreateProposalRequest {
  project_id: string
  acq_mode_id: number
  proposal_title: string
  description?: string
  area_office?: string
  colliery_code?: string
  adjacent_colliery?: string
  notification_date?: Date
  proposal_no?: string
  proposal_type?: string
  rate_tenancy_land_with_emp?: number
  rate_tenancy_land_no_emp?: number
  rate_govt_land?: number
  rate_forest_land?: number
  employment_proposed_count?: number
  employment_system?: string
  has_debottar_land?: boolean
  has_tribal_land?: boolean
  has_formal_negotiation?: boolean
  user_id: string
  user_name: string
  user_role: string
}

export interface CreateProposalResponse {
  id: string
  schedule_code: string
  proposal_title: string
  message: string
}

export class CreateProposalUseCase implements IUseCase<CreateProposalRequest, CreateProposalResponse> {
  constructor(
    private readonly proposalRepository: IProposalRepository,
    private readonly projectRepository: IProjectRepository
  ) {}

  async execute(request: CreateProposalRequest): Promise<Result<CreateProposalResponse>> {
    // 1. Validate project exists and is locked
    const project = await this.projectRepository.findById(request.project_id)
    if (!project) {
      return Fail('Project')
    }

    if (!project.isLocked()) {
      return Fail('Project must be locked')
    }

    // 2. Validate and create domain entity
    const proposalResult = Proposal.create({
      projectId: request.project_id,
      acq_mode_id: request.acq_mode_id,
      proposalTitle: request.proposal_title,
      description: request.description,
      proposedBy: request.user_name,
      proposedByRole: request.user_role,
      areaOffice: request.area_office || (project as any).area_cd || 'UNK',
      collieryCode: request.colliery_code || project.mineCds[0] || project.id || 'UNK',
      adjacentColliery: request.adjacent_colliery,
      notificationDate: request.notification_date,
      proposalNo: request.proposal_no,
      proposalType: request.proposal_type,
      rateTenancyWithEmp: request.rate_tenancy_land_with_emp,
      rateTenancyNoEmp: request.rate_tenancy_land_no_emp,
      rateGovtLand: request.rate_govt_land,
      rateForestLand: request.rate_forest_land,
      employmentProposedCount: request.employment_proposed_count,
      employmentSystem: request.employment_system,
      hasDebottarLand: request.has_debottar_land,
      hasTribalLand: request.has_tribal_land,
      hasFormalNegotiation: request.has_formal_negotiation,
    })

    if (proposalResult.isFailure) {
      return Fail(String(proposalResult.error!))
    }

    const proposal = proposalResult.value

    // 3. Persist
    await this.proposalRepository.save(proposal)

    // 4. Publish events
    const domainEvents = proposal.clearDomainEvents()
    for (const event of domainEvents) { await EventBus.publish({
        event_name: event.event_type,
        module: 'land-acquisition',
        user_id: request.user_id,
        entity_id: event.aggregateId,
        data: event.payload,
      })
    }

    // 5. Audit logging
    AuditQueue.push({
      event_type: 'CREATE_PROPOSAL',
      entity_name: MODULE_CODES.LAND_SCHEDULE,
      entity_id: proposal.id,
      user_id: request.user_id,
      remarks: JSON.stringify({
        schedule_code: proposal.scheduleCode.value,
        proposal_title: proposal.proposalTitle,
        project_id: proposal.projectId,
      }),
    })

    // 6. Return response
    return Ok({
      id: proposal.id,
      schedule_code: proposal.scheduleCode.value,
      proposal_title: proposal.proposalTitle,
      message: `Proposal "${proposal.scheduleCode.value}" created successfully.`,
    })
  }
}
