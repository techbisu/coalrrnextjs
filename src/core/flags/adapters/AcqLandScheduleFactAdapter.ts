import { IFactSourceAdapter } from '../interfaces/IFactSourceAdapter'
import { CHECKABLE_ENTITY_TYPES, ACQ_MODE_ID } from '@/core/config/module-codes.config'
import { buildLandCategoryMap } from '@/core/compliance/utils/landCategoryMap'
import { db } from '@/lib/db'

/**
 * AcqLandScheduleFactAdapter
 *
 * Resolves authoritative domain data, derived facts, and persisted entity flags for Acquisition Proposals (acq_land_schedule).
 * Primary key `entityId` is the `acq_proposal.proposal_id` UUID string.
 */
export class AcqLandScheduleFactAdapter implements IFactSourceAdapter {
  readonly entityType = CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE

  async resolveDomainFacts(entityId: string): Promise<Record<string, any>> {
    const proposal = await db.acq_proposal.findUnique({
      where: { proposal_id: entityId },
    })

    if (!proposal) {
      return {}
    }

    // Dynamic derived facts
    const plotCount = await db.plot_schedule.count({
      where: { proposal_id: entityId },
    })

    const entityContext = await (db as any).checklist_entity_context
      ?.findFirst({
        where: {
          checkable_type: { in: [CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE] },
          checkable_id: entityId,
        },
      })
      .catch(() => null)

    let cachedContext: Record<string, any> = {}
    if (entityContext && entityContext.context_data) {
      cachedContext =
        typeof entityContext.context_data === 'string'
          ? JSON.parse(entityContext.context_data)
          : (entityContext.context_data as Record<string, any>)
    }

    // Dynamic land classification calculation from plot schedule
    let hasGovt = cachedContext.has_govt_land ?? false
    let hasTenancy = cachedContext.has_tenancy_land ?? false
    let hasPatta = cachedContext.has_patta_land ?? false

    if (!hasGovt && !hasTenancy && !hasPatta) {
      try {
        const plots = await db.plot_schedule.findMany({
          where: { proposal_id: entityId },
          include: { plot_schedule_land_type: true },
        })
        const landCategoryMap = await buildLandCategoryMap()

        for (const p of plots) {
          for (const lt of p.plot_schedule_land_type || []) {
            const cat = landCategoryMap.get(Number(lt.landt_id))
            if (cat === 'GOVT') hasGovt = true
            if (cat === 'TENANCY') hasTenancy = true
            if (cat === 'PATTA') hasPatta = true
          }
        }
      } catch {
        // Fallback to cachedContext if query fails
      }
    }

    const acqModeId = Number(proposal.acq_mode_id)
    const hasCmdApproval = Boolean(proposal.cmd_admin_approval_ref || proposal.pr_scheme_ref_no)
    const hasRehabCostOrDisplacement = Number(proposal.total_rehab_cost_est || 0) > 0 || Boolean(cachedContext.has_displacement)

    return {
      // Land classification derived facts
      has_forest_land: cachedContext.has_forest_land ?? false,
      has_govt_land: hasGovt,
      has_tenancy_land: hasTenancy,
      has_patta_land: hasPatta,
      has_displacement: cachedContext.has_displacement ?? false,
      has_statutory_clearances: cachedContext.has_statutory_clearances ?? false,
      has_employment_involvement: cachedContext.has_employment_involvement ?? false,

      // Authoritative domain table fields
      acq_mode: acqModeId,
      acq_mode_id: acqModeId,
      acqModeId: acqModeId,
      stage: proposal.current_stage_cd,
      current_stage_cd: proposal.current_stage_cd,

      // Legacy fallback context facts (will be overridden by FactResolver if entity_flags exist)
      requires_board_approval: false,
      is_board_approval_req: false,
      has_tribal_land: cachedContext.has_tribal_land ?? false,
      has_debottar_land: cachedContext.has_debottar_land ?? false,
      is_disputed_land: cachedContext.has_disputed_land ?? false,
      has_formal_negotiation:
        cachedContext.has_formal_negotiation ?? (acqModeId === ACQ_MODE_ID.DIRECT_PURCHASE),

      // Derived business logic flags
      reconciliation_required: cachedContext.reconciliation_required ?? (acqModeId === ACQ_MODE_ID.CBA || acqModeId === ACQ_MODE_ID.LA_ACT_1948),
      reconciliation_required_by_rules: cachedContext.reconciliation_required ?? (acqModeId === ACQ_MODE_ID.CBA || acqModeId === ACQ_MODE_ID.LA_ACT_1948),
      reconciliation_certificate_uploaded: false,
      anti_duplication_clear: false,
      has_paf_rehabilitation: hasRehabCostOrDisplacement,
      cmd_admin_approval_ref: hasCmdApproval,

      // Form-XVI Five-Point Certificate facts (auto-calculated with entity_flag override precedence)
      land_not_previously_acquired: true,
      not_acquired_by_erstwhile_management: true,
      not_affected_before_nationalization: true,
      not_government_or_vested_land: !hasGovt,
      master_plan_rehabilitation_applicable: hasRehabCostOrDisplacement,
      competent_authority_approval_available: hasCmdApproval,

      total_area_acres: proposal.tot_acq_area ? Number(proposal.tot_acq_area) : 0,
      tot_acq_area: proposal.tot_acq_area ? Number(proposal.tot_acq_area) : 0,
      proj_cd: proposal.proj_cd,
      proposal_no: proposal.proposal_no,

      // Derived dynamic facts
      plot_count: plotCount,
      has_plots: plotCount > 0,
    }
  }
}
