/**
 * Create Proposal Use Case - Application service for creating new land acquisition proposals.
 */
import { IUseCase, Result, Fail, Ok } from '@/core'
import { Proposal, IProposalRepository } from '@/domain/entities/proposal'
import { IProjectRepository } from '@/domain/entities/project'
import { EventBus } from '@/core/notifications/EventBus'
import { auditQueue as AuditQueue } from '@/infrastructure/di/Container'
import { ValidationException, NotFoundException } from '@/core/errors'

export interface CreateProposalRequest {
  project_id: string
  acquisition_mode: string
  proposal_title: string
  description?: string
  area_office?: string
  adjacent_colliery?: string
  notification_date?: Date
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
      project_id: request.project_id,
      acquisition_mode: request.acquisition_mode,
      proposal_title: request.proposal_title,
      description: request.description,
      proposed_by: request.user_name,
      proposed_by_role: request.user_role,
      area_office: request.area_office,
      colliery_code: project.colliery_code,
      adjacent_colliery: request.adjacent_colliery,
      notification_date: request.notification_date,
    })

    if (proposalResult.isFailure) {
      return Fail(String(proposalResult.error!))
    }

    const proposal = proposalResult.value

    // 3. Persist
    await this.proposalRepository.save(proposal)

    // 4. Publish events
    const domainEvents = proposal.clearDomainEvents()
    for (const event of domainEvents) {
      EventBus.publish({
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
      entity_name: 'land_schedule',
      entity_id: proposal.id,
      user_id: request.user_id,
      remarks: JSON.stringify({
        schedule_code: proposal.schedule_code.value,
        proposal_title: proposal.proposal_title,
        project_id: proposal.project_id,
      }),
    })

    // 6. Return response
    return Ok({
      id: proposal.id,
      schedule_code: proposal.schedule_code.value,
      proposal_title: proposal.proposal_title,
      message: `Proposal "${proposal.schedule_code.value}" created successfully.`,
    })
  }
}
