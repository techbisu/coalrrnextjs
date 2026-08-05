import { IChecklistContextResolver } from '@/core/checklist/interfaces/IChecklistContextResolver';
import { IProposalRepository } from '@/domain/entities/proposal/IProposalRepository';

export class ProposalContextResolver implements IChecklistContextResolver {
  constructor(private proposalRepo: IProposalRepository) {}

  async resolve(checkableId: string): Promise<Record<string, any>> {
    const proposal = await this.proposalRepo.findById(checkableId);
    if (!proposal) {
      throw new Error(`Proposal ${checkableId} not found`);
    }

    // Return the context variables that show_if rules will evaluate against
    return {
      acq_mode: proposal.acquisitionMode.value,
      has_debottar_land: proposal.hasDebottarLand,
      has_tribal_land: proposal.hasTribalLand,
      is_disputed_land: proposal.hasDisputedLand,
      has_formal_negotiation: proposal.hasFormalNegotiation,
      proposal_type: proposal.toPersistence().proposalType || 'STANDARD_LAP'
    };
  }
}
