/**
 * Get Checklist Use Case - Retrieves the full proposal checklist with progress.
 */
import { IUseCase, Result, Fail, Ok } from '@/core'
import { PrismaProposalRepository } from '@/infrastructure/persistence/repositories/PrismaProposalRepository'
import { NotFoundException } from '@/core/errors'

export interface GetChecklistRequest {
  proposalId: string
}

// DTO for checklist items returned to the UI
export interface ChecklistItemDTO {
  key: string
  label: string
  required: boolean
  status: 'pending' | 'in_progress' | 'complete' | 'not_applicable'
}

export interface GetChecklistResponse {
  checklistCode: string
  items: ChecklistItemDTO[]
  progress: {
    completedRequired: number
    totalRequired: number
    percentage: number
    allRequiredDone: boolean
  }
}

export class GetChecklistUseCase implements IUseCase<GetChecklistRequest, GetChecklistResponse> {
  constructor(
    private readonly proposalRepository: PrismaProposalRepository
  ) {}

  async execute(request: GetChecklistRequest): Promise<Result<GetChecklistResponse>> {
    const data = await this.proposalRepository.getProposalDetailsWithPlots(request.proposalId)
    if (!data) {
      return Fail('Proposal')
    }

    const checklist = checklistFromJSON(data.mode_specific_checklist ?? '{"items":[]}')
    const progress = calculateProgress(checklist)

    return Ok({
      checklistCode: data.schedule_code,
      items: checklist.items.map((item: any) => ({
        key: item.key,
        label: item.label,
        required: item.required,
        status: item.status,
      })),
      progress,
    })
  }
}

function checklistFromJSON(json: string) {
  try {
    return JSON.parse(json) as { checklistCode: string; items: any[] }
  } catch {
    return { checklistCode: 'CL-1.0', items: [] }
  }
}

function calculateProgress(checklist: { checklistCode: string; items: any[] }) {
  const requiredItems = checklist.items.filter((item: any) => item.required)
  const completedRequired = checklist.items.filter((item: any) => item.required && item.status === 'complete').length
  
  return {
    completedRequired,
    totalRequired: requiredItems.length,
    percentage: requiredItems.length > 0 ? Math.round((completedRequired / requiredItems.length) * 100) : 0,
    allRequiredDone: requiredItems.length > 0 && completedRequired === requiredItems.length,
  }
}