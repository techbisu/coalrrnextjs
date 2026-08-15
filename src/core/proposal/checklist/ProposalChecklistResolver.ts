import { IChecklistContextResolver } from '@/core/checklist/interfaces/IChecklistContextResolver';
import { IProposalRepository } from '@/domain/entities/proposal';
import { db } from '@/lib/db';
import { CHECKABLE_ENTITY_TYPES, ACQ_MODE_ID } from '@/core/config/module-codes.config';
import { ConditionContextBuilder } from '@/core/flags/services/ConditionContextBuilder';

export class ProposalChecklistResolver implements IChecklistContextResolver {
  constructor(
    private proposalRepo: IProposalRepository,
    private contextBuilder?: ConditionContextBuilder
  ) {}

  async resolve(entityId: string): Promise<Record<string, any>> {
    // 1. Resolve unified ConditionContext from FactResolver (if contextBuilder provided)
    let factContext: Record<string, any> = {};
    if (this.contextBuilder) {
      try {
        const conditionContext = await this.contextBuilder.buildContext(
          CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE,
          entityId
        );
        factContext = conditionContext.toDictionary();
      } catch (err: any) {
        console.warn(`[ProposalChecklistResolver] Failed to resolve ConditionContext for ${entityId}:`, err.message);
      }
    }

    // 2. Fetch proposal directly for base fallbacks
    const proposal = await this.proposalRepo.getProposalById(entityId);
    if (!proposal && Object.keys(factContext).length === 0) {
      throw new Error(`Proposal ${entityId} not found`);
    }

    // 3. Fetch pre-computed dynamic flags from checklist_entity_context table (snapshot context)
    const entityContext = await (db as any).checklist_entity_context?.findFirst({
      where: {
        checkable_type: { in: [CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE] },
        checkable_id: entityId
      }
    }).catch(() => null);

    let snapshotData: Record<string, any> = {};
    if (entityContext && entityContext.context_data) {
      snapshotData = typeof entityContext.context_data === 'string' 
        ? JSON.parse(entityContext.context_data) 
        : (entityContext.context_data as Record<string, any>);
    }

    const acqModeId = proposal ? Number(proposal.acq_mode_id) : Number(factContext.acq_mode_id || 0);

    // 4. Base context fallback
    const baseContext = {
      acq_mode: acqModeId,
      acq_mode_id: acqModeId,
      acqModeId: acqModeId,
      is_board_approval_req: proposal?.requires_board_approval ?? false,
      requires_board_approval: proposal?.requires_board_approval ?? false,
      stage: proposal?.current_stage_cd || 'Drafting',
      current_stage_cd: proposal?.current_stage_cd || 'Drafting',
      
      has_tribal_land: proposal?.has_tribal_land ?? false,
      has_debottar_land: proposal?.has_debottar_land ?? false,
      has_disputed_land: (proposal as any)?.is_disputed_land ?? false,
      has_formal_negotiation: proposal?.has_formal_negotiation ?? (acqModeId === ACQ_MODE_ID.DIRECT_PURCHASE),
    };

    // 5. Merge hierarchy: baseContext < snapshotData < factContext
    // Live ConditionContext facts take top priority (including Phase 1 entity_flag overrides)
    return {
      ...baseContext,
      ...snapshotData,
      ...factContext
    };
  }
}
