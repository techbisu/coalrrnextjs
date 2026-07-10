import { IUseCase, Result, Fail, Ok } from '@/core'
import { IProposalRepository } from '@/domain/entities/proposal'
import { NotFoundException } from '@/core/errors'

export interface ReclassifyPlotRequest {
  proposalId: string
  plot_id: string
  annexure_tag: 'A' | 'B' | 'C'
  user_id: string
}

export class ReclassifyPlotUseCase implements IUseCase<ReclassifyPlotRequest, void> {
  constructor(private readonly repository: IProposalRepository) {}

  async execute(request: ReclassifyPlotRequest): Promise<Result<void>> {
    const proposal = await this.repository.findById(request.proposalId)
    if (!proposal) {
      return Fail('Proposal')
    }

    if (!proposal.canBeEdited()) {
      return Fail(`Proposal cannot be edited in state ${proposal.state.value}`)
    }

    // Rely on the infrastructure repository to update the tag in the association
    await this.repository.updatePlotAnnexure(request.proposalId, request.plot_id, request.annexure_tag)

    return Ok(undefined)
  }
}
