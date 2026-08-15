import { IFactSourceAdapter } from '../interfaces/IFactSourceAdapter'
import { CHECKABLE_ENTITY_TYPES, ACQ_MODE_ID } from '@/core/config/module-codes.config'
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

    // Fetch authoritative flags from entity_flag table
    const flags = await (db as any).entity_flag
      ?.findMany({
        where: {
          entity_type: CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE,
          entity_id: entityId,
        },
      })
      .catch(() => [])

    const flagMap: Record<string, any> = {}
    if (Array.isArray(flags)) {
      for (const f of flags) {
        flagMap[f.flag_code] = f.flag_value
      }
    }

    const acqModeId = Number(proposal.acq_mode_id)

    return {
      // Land classification derived facts
      has_forest_land: cachedContext.has_forest_land ?? false,
      has_govt_land: cachedContext.has_govt_land ?? false,
      has_tenancy_land: cachedContext.has_tenancy_land ?? false,
      has_patta_land: cachedContext.has_patta_land ?? false,
      has_displacement: cachedContext.has_displacement ?? false,
      has_statutory_clearances: cachedContext.has_statutory_clearances ?? false,
      has_employment_involvement: cachedContext.has_employment_involvement ?? false,

      // Authoritative domain table fields
      acq_mode: acqModeId,
      acq_mode_id: acqModeId,
      acqModeId: acqModeId,
      stage: proposal.current_stage_cd,
      current_stage_cd: proposal.current_stage_cd,

      // Authoritative entity_flag conditional facts
      requires_board_approval: flagMap['requires_board_approval'] ?? false,
      is_board_approval_req: flagMap['requires_board_approval'] ?? false,
      has_tribal_land: flagMap['has_tribal_land'] ?? cachedContext.has_tribal_land ?? false,
      has_debottar_land: flagMap['has_debottar_land'] ?? cachedContext.has_debottar_land ?? false,
      is_disputed_land: flagMap['is_disputed_land'] ?? cachedContext.has_disputed_land ?? false,
      has_formal_negotiation:
        flagMap['has_formal_negotiation'] ?? cachedContext.has_formal_negotiation ?? (acqModeId === ACQ_MODE_ID.DIRECT_PURCHASE),

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
