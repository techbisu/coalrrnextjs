/**
 * Update Checklist Item Use Case - Update a specific checklist item status.
 */
import { IUseCase, Result, Fail, Ok } from '@/core'
import { IProposalRepository } from '@/domain/entities/proposal'
import { EventBus } from '@/core/notifications/EventBus'
import { auditQueue as AuditQueue } from '@/infrastructure/di/Container'
import { NotFoundException } from '@/core/errors'

export interface UpdateChecklistItemRequest {
  proposalId: string
  itemKey: string
  status: 'pending' | 'in_progress' | 'complete' | 'not_applicable'
  user_id: string
}

export interface UpdateChecklistItemResponse {
  scheduleCode: string
  itemKey: string
  newStatus: string
  message: string
}

export class UpdateChecklistItemUseCase implements IUseCase<UpdateChecklistItemRequest, UpdateChecklistItemResponse> {
  constructor(
    private readonly proposalRepository: IProposalRepository
  ) {}

  async execute(request: UpdateChecklistItemRequest): Promise<Result<UpdateChecklistItemResponse>> {
    const proposal = await this.proposalRepository.findById(request.proposalId)
    if (!proposal) {
      return Fail('Proposal')
    }

    const result = proposal.updateChecklistItem(request.itemKey, request.status)

    if (result.isFailure) {
      return Fail(String(result.error!))
    }

    await this.proposalRepository.save(proposal)

    // Audit logging
    AuditQueue.push({
      event_type: 'UPDATE_CHECKLIST_ITEM',
      entity_name: 'land_schedule',
      entity_id: proposal.id,
      user_id: request.user_id,
      remarks: JSON.stringify({ itemKey: request.itemKey, status: request.status }),
    })

    return Ok({
      scheduleCode: proposal.scheduleCode.value,
      itemKey: request.itemKey,
      newStatus: request.status,
      message: `Checklist item ${request.itemKey} updated successfully.`,
    })
  }
}