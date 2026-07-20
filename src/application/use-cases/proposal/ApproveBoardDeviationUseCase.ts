/**
 * Approve Board Deviation Use Case - Unlocks a LIMIT_BREACHED proposal.
 */
import { IUseCase, Result, Fail, Ok } from '@/core'
import { IProposalRepository } from '@/domain/entities/proposal'
import { IProjectRepository } from '@/domain/entities/project'
import { EventBus } from '@/core/notifications/EventBus'
import { randomUUID } from 'crypto'
import { auditQueue as AuditQueue } from '@/infrastructure/di/Container'
import { db } from '@/lib/db'

export interface ApproveBoardDeviationRequest {
  proposalId: string
  user_id: string
  oldLimitAcres: string | number
  extendedLimitAcres: string | number
  extendedCostLimit?: string | number
  oldCostLimit?: string | number
  extendedEmploymentQuota?: string | number
  oldEmploymentQuota?: string | number
  signedDocumentFileId?: string
  comments?: string
}

export interface ApproveBoardDeviationResponse {
  id: string
  newState: string
  message: string
}

export class ApproveBoardDeviationUseCase implements IUseCase<ApproveBoardDeviationRequest, ApproveBoardDeviationResponse> {
  constructor(
    private readonly proposalRepository: IProposalRepository,
    private readonly projectRepository: IProjectRepository
  ) {}

  async execute(request: ApproveBoardDeviationRequest): Promise<Result<ApproveBoardDeviationResponse>> {
    // 1. Find proposal
    const proposal = await this.proposalRepository.findById(request.proposalId)
    if (!proposal) {
      return Fail('Proposal not found')
    }

    // 2. Find project
    const project = await this.projectRepository.findById(proposal.projectId)
    if (!project) {
      return Fail('Project not found')
    }

    // 3. Update project limits
    const updateResult = project.updateTotalLandLimit(request.extendedLimitAcres)
    if (updateResult.isFailure) return Fail(String(updateResult.error))

    if (request.extendedCostLimit) {
      const costResult = project.updateTotalBudgetCeiling(request.extendedCostLimit)
      if (costResult.isFailure) return Fail(String(costResult.error))
    }

    if (request.extendedEmploymentQuota) {
      const jobResult = project.updateTotalEmploymentQuota(request.extendedEmploymentQuota)
      if (jobResult.isFailure) return Fail(String(jobResult.error))
    }

    await this.projectRepository.save(project)

    // 4. Link signed document if provided
    if (request.signedDocumentFileId) {
      await db.file_attachment.createMany({
        skipDuplicates: true,
        data: [
          {
            id: randomUUID(),
            file_id: request.signedDocumentFileId,
            entity_type: 'land_schedule',
            entity_id: proposal.id,
            module: 'land-acquisition',
            attached_by: request.user_id,
          },
          {
            id: randomUUID(),
            file_id: request.signedDocumentFileId,
            entity_type: 'mst_project',
            entity_id: project.id,
            module: 'project-master',
            attached_by: request.user_id,
          }
        ]
      })
    }

    // 5. Execute proposal behavior
    const approveResult = proposal.approveBoardDeviation(request.user_id)
    if (approveResult.isFailure) {
      return Fail(String(approveResult.error!))
    }

    // 6. Persist proposal
    await this.proposalRepository.save(proposal)

    // 7. Publish events
    const domainEvents = proposal.clearDomainEvents()
    for (const event of domainEvents) {
      EventBus.publish({
        event_name: event.event_type,
        module: 'land-acquisition',
        user_id: request.user_id,
        entity_id: event.aggregateId,
        data: {
          ...event.payload,
          comments: request.comments,
        },
      })
    }

    // 8. Audit logging
    AuditQueue.push({
      event_type: 'PROPOSAL_BOARD_APPROVED',
      entity_name: 'land_schedule',
      entity_id: proposal.id,
      user_id: request.user_id,
      remarks: request.comments ?? 'Board approved the deviation limits',
    })

    let revisedRemarks = `Limit revised from ${request.oldLimitAcres} to ${request.extendedLimitAcres} Acres via Form-XXII (Proposal ${proposal.scheduleCode.value})`;
    if (request.extendedCostLimit) {
      revisedRemarks += `. Budget ceiling revised from ${request.oldCostLimit || 'N/A'} to ${request.extendedCostLimit}.`;
    }
    if (request.extendedEmploymentQuota) {
      revisedRemarks += `. Employment Quota revised from ${request.oldEmploymentQuota || 'N/A'} to ${request.extendedEmploymentQuota}.`;
    }

    AuditQueue.push({
      event_type: 'PROJECT_LIMIT_REVISED',
      entity_name: 'mst_project',
      entity_id: project.id,
      user_id: request.user_id,
      remarks: revisedRemarks,
    })

    // 8b. Publish to Notification Framework (triggers IN_APP notification)
    EventBus.publish({
      event_name: 'PROJECT_LIMIT_REVISED',
      module: 'project-master',
      user_id: request.user_id,
      entity_id: project.id,
      data: {
        message: revisedRemarks,
        project_name: project.name,
        proposal_id: proposal.id,
      },
    })

    // 9. Return response
    return Ok({
      id: proposal.id,
      newState: proposal.state.value,
      message: `Deviation for Proposal ${proposal.scheduleCode.value} has been Board Approved. Limit expanded to ${request.extendedLimitAcres} Acres.`,
    })
  }
}
