import { IProposalRepository, ProposalDTO, ProposalCostSheetData } from '@/domain/entities/proposal'
import { Result } from '@/core/result/Result'
import { proposalCostSheetSchema, ProposalCostSheetInput } from '@/shared/schemas/proposal-cost-sheet.schema'

export class UpdateProposalCostSheetUseCase {
  constructor(private proposalRepository: IProposalRepository) {}

  async execute(proposalId: string, input: ProposalCostSheetInput): Promise<Result<ProposalDTO, Error>> {
    try {
      const parsed = proposalCostSheetSchema.safeParse(input)
      if (!parsed.success) {
        return Result.fail(new Error(parsed.error.issues?.[0]?.message || 'Invalid cost sheet input'))
      }

      const existing = await this.proposalRepository.getProposalById(proposalId)
      if (!existing) {
        return Result.fail(new Error(`Proposal '${proposalId}' not found`))
      }

      const updated = await this.proposalRepository.updateProposalCostSheet(proposalId, parsed.data)
      return Result.ok(updated)
    } catch (err: any) {
      return Result.fail(new Error(err.message || 'Failed to update proposal cost sheet'))
    }
  }
}
