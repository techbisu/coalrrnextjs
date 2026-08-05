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
    
    // Check Tribal / Debottar / Displacement / Land Types across all plots
    let hasTribalLand = false;
    let hasDebottarLand = false;
    let hasDisplacement = false;
    let hasForestLand = false;
    let hasTenancyLand = false;
    let hasGovtLand = false;

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
          if (typeName.includes('forest')) {
            hasForestLand = true;
          }
          if (typeName.includes('tenancy') || typeName.includes('raiyati') || typeName.includes('rayati')) {
            hasTenancyLand = true;
          }
          if (typeName.includes('govt') || typeName.includes('patta') || typeName.includes('gair majarua') || typeName.includes('gm')) {
            hasGovtLand = true;
          }
        }
      }
    }

    // Check project data for clearances and employment
    let hasStatutoryClearances = false;
    let hasEmploymentInvolvement = false;
    const project = await db.project.findUnique({
      where: { projCd: proposal.proj_cd }
    });

    if (project) {
      if (project.statutoryClearances && Object.keys(project.statutoryClearances).length > 0) {
        hasStatutoryClearances = true;
      }
      if ((project.totalEmpSanctioned && project.totalEmpSanctioned > 0) || (proposal.total_employment_cost_est && Number(proposal.total_employment_cost_est) > 0)) {
        hasEmploymentInvolvement = true;
      }
    }

    // Direct Purchase specific assumption for Formal Negotiation
    // We assume if it's Direct Purchase (6), there might be formal negotiations, so we expose the flag.
    const hasFormalNegotiation = Number(proposal.acq_mode_id) === 6;

    // Context map injected into the Checklist Rule Engine
    return {
      acqModeId: Number(proposal.acq_mode_id),
      HAS_TRIBAL_LAND: proposal.has_tribal_land ?? hasTribalLand,
      HAS_DEBOTTAR_LAND: proposal.has_debottar_land ?? hasDebottarLand,
      HAS_DISPUTED_LAND: (proposal as any).is_disputed_land ?? false,
      HAS_DISPLACEMENT: hasDisplacement,
      HAS_FOREST_LAND: hasForestLand,
      HAS_TENANCY_LAND: hasTenancyLand,
      HAS_GOVT_LAND: hasGovtLand,
      HAS_STATUTORY_CLEARANCES: hasStatutoryClearances,
      HAS_EMPLOYMENT_INVOLVEMENT: hasEmploymentInvolvement,
      HAS_FORMAL_NEGOTIATION: proposal.has_formal_negotiation ?? hasFormalNegotiation,
      IS_RFCTLARR: Number(proposal.acq_mode_id) === 5,
      IS_BOARD_APPROVAL_REQ: proposal.requires_board_approval,
      STAGE: proposal.current_stage_cd
    };
  }
}
