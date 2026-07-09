/**
 * Create Proposal Use Case - Application service for creating new land acquisition proposals.
 */
import { IUseCase, Result, Fail, Ok } from '@/core'
import { Proposal, IProposalRepository } from '@/domain/entities/proposal'
import { IProjectRepository } from '@/domain/entities/project'
import { EventBus } from '@/notifications/EventBus'
import { AuditQueue } from '@/audit/services/AuditQueue'
import { ValidationException, NotFoundException } from '@/core/errors'

export interface CreateProposalRequest {
  projectId: string
  acquisitionMode: string
  proposalTitle: string
  description?: string
  areaOffice?: string
  adjacentColliery?: string
  notificationDate?: Date
  userId: string
  userName: string
  userRole: string
}

export interface CreateProposalResponse {
  id: string
  scheduleCode: string
  proposalTitle: string
  message: string
}

export class CreateProposalUseCase implements IUseCase<CreateProposalRequest, CreateProposalResponse> {
  constructor(
    private readonly proposalRepository: IProposalRepository,
    private readonly projectRepository: IProjectRepository
  ) {}

  async execute(request: CreateProposalRequest): Promise<Result<CreateProposalResponse>> {
    // 1. Validate project exists and is locked
    const project = await this.projectRepository.findById(request.projectId)
    if (!project) {
      return Fail(new NotFoundException('Project', request.projectId))
    }

    if (!project.isLocked()) {
      return Fail(new ValidationException('Project must be locked', [
        { field: 'projectId', message: 'Cannot create proposal against an unlocked project baseline' }
      ]))
    }

    // 2. Validate and create domain entity
    const proposalResult = Proposal.create({
      projectId: request.projectId,
      acquisitionMode: request.acquisitionMode,
      proposalTitle: request.proposalTitle,
      description: request.description,
      proposedBy: request.userName,
      proposedByRole: request.userRole,
      areaOffice: request.areaOffice,
      collieryCode: project.collieryCode,
      adjacentColliery: request.adjacentColliery,
      notificationDate: request.notificationDate,
    })

    if (proposalResult.isFailure) {
      return Fail(proposalResult.error!)
    }

    const proposal = proposalResult.value

    // 3. Persist
    await this.proposalRepository.save(proposal)

    // 4. Publish events
    const domainEvents = proposal.clearDomainEvents()
    for (const event of domainEvents) {
      EventBus.publish({
        eventName: event.eventType,
        module: 'land-acquisition',
        userId: request.userId,
        entityId: event.aggregateId,
        data: event.payload,
      })
    }

    // 5. Audit logging
    AuditQueue.push({
      action: 'CREATE_PROPOSAL',
      entityType: 'LandSchedule',
      entityId: proposal.id,
      userId: request.userId,
      details: JSON.stringify({
        scheduleCode: proposal.scheduleCode.value,
        proposalTitle: proposal.proposalTitle,
        projectId: proposal.projectId,
      }),
    })

    // 6. Return response
    return Ok({
      id: proposal.id,
      scheduleCode: proposal.scheduleCode.value,
      proposalTitle: proposal.proposalTitle,
      message: `Proposal "${proposal.scheduleCode.value}" created successfully.`,
    })
  }
}
