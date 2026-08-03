import { IChecklistContextResolver } from '@/core/checklist/interfaces/IChecklistContextResolver';
import { IProposalRepository } from '@/domain/entities/proposal';
import { db } from '@/lib/db';

export class ProposalChecklistResolver implements IChecklistContextResolver {
  constructor(
    private proposalRepo: IProposalRepository
  ) {}

  async resolve(entityId: string): Promise<Record<string, any>> {
    const proposal = await this.proposalRepo.getProposalById(entityId);
    if (!proposal) {
      throw new Error(`Proposal ${entityId} not found`);
    }

    const plots = await this.proposalRepo.getPlotsByProposalId(entityId);
    
    // Check Tribal / Debottar / Displacement land across all plots
    let hasTribalLand = false;
    let hasDebottarLand = false;
    let hasDisplacement = false;

    for (const plot of plots) {
      const landTypes = await this.proposalRepo.getLandTypesByScheduleId(plot.schedule_id!);
      for (const lt of landTypes) {
        // Look up the land type name in the master table
        const masterType = await db.landtype_master.findUnique({
          where: { landt_id: BigInt(lt.landt_id) }
        });
        
        if (masterType) {
          const typeName = masterType.land_type.toLowerCase();
          if (typeName.includes('tribal') || typeName.includes('cnt') || typeName.includes('spt')) {
            hasTribalLand = true;
          }
          if (typeName.includes('debottar') || typeName.includes('deity')) {
            hasDebottarLand = true;
          }
          if (typeName.includes('habitation') || typeName.includes('bastu') || typeName.includes('residential') || typeName.includes('ghar') || typeName.includes('house')) {
            hasDisplacement = true;
          }
        }
      }
    }

    // Context map injected into the Checklist Rule Engine
    return {
      acqModeId: proposal.acq_mode_id,
      HAS_TRIBAL_LAND: hasTribalLand,
      HAS_DEBOTTAR_LAND: hasDebottarLand,
      HAS_DISPLACEMENT: hasDisplacement,
      IS_RFCTLARR: proposal.acq_mode_id === 5, // Assuming 5 is RFCTLARR, rule engine can also just check ACQ_MODE directly
      IS_BOARD_APPROVAL_REQ: proposal.requires_board_approval,
      STAGE: proposal.current_stage_cd
    };
  }
}
