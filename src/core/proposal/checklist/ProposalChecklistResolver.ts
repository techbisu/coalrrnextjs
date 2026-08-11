import { IChecklistContextResolver } from '@/core/checklist/interfaces/IChecklistContextResolver';
import { IProposalRepository } from '@/domain/entities/proposal';
import { db } from '@/lib/db';

import { ACQ_LAND_SCHEDULE, ACQ_MODE_ID } from '@/core/config/module-codes.config';

export class ProposalChecklistResolver implements IChecklistContextResolver {
  constructor(
    private proposalRepo: IProposalRepository
  ) {}

  async resolve(entityId: string): Promise<Record<string, any>> {
    const proposal = await this.proposalRepo.getProposalById(entityId);
    if (!proposal) {
      throw new Error(`Proposal ${entityId} not found`);
    }

    // 1. Fetch pre-computed dynamic flags from the new checklist_entity_context table
    const entityContext = await db.checklist_entity_context.findFirst({
      where: {
        checkable_type: { in: [ACQ_LAND_SCHEDULE, 'LAND_ACQ_PROPOSAL', 'acq_land_schedule'] },
        checkable_id: entityId
      }
    });

    let contextData = {};
    if (entityContext && entityContext.context_data) {
      contextData = typeof entityContext.context_data === 'string' 
        ? JSON.parse(entityContext.context_data) 
        : entityContext.context_data;
    } else {
      console.warn(`[ProposalChecklistResolver] No context found for proposal ${entityId}. A sync job may still be pending.`);
    }

    // 2. Base properties directly from the proposal
    // We provide these as fallbacks in case the context sync hasn't run yet,
    // and also to ensure the core immutable properties are always present.
    const baseContext = {
      acq_mode_id: Number(proposal.acq_mode_id),
      is_board_approval_req: proposal.requires_board_approval,
      stage: proposal.current_stage_cd,
      
      // Fallbacks for flags usually set by the sync job
      has_tribal_land: proposal.has_tribal_land ?? false,
      has_debottar_land: proposal.has_debottar_land ?? false,
      has_disputed_land: (proposal as any).is_disputed_land ?? false,
      has_formal_negotiation: proposal.has_formal_negotiation ?? (Number(proposal.acq_mode_id) === ACQ_MODE_ID.DIRECT_PURCHASE),
    };

    // 3. Merge them together. 
    // contextData (from DB JSON) overrides baseContext if it contains the keys.
    return {
      ...baseContext,
      ...contextData
    };
  }
}
