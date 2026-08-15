import { db } from '@/lib/db'
import { ACQ_LAND_SCHEDULE } from '@/core/config/module-codes.config'

export interface SyncChecklistContextPayload {
  entityId: string // proposal_id
}

export type JobResult<T = void> =
  | { isSuccess: true; value?: T }
  | { isSuccess: false; error: Error }

export type JobHandler<P, R = void> = (payload: P) => Promise<JobResult<R>>

/**
 * syncChecklistContext Job Handler
 *
 * Scans proposal and plot schedule records for a given proposal ID,
 * aggregates dynamic land types, and caches the resolved flags into
 * `checklist_entity_context` table for fast O(1) checklist condition evaluations.
 */
export const syncChecklistContextHandler = async (payload: SyncChecklistContextPayload): Promise<JobResult<void>> => {
  const { entityId } = payload

  if (!entityId) {
    return { isSuccess: false, error: new Error('entityId is required') }
  }

  // 1. Fetch Proposal
  const proposal = await db.acq_proposal.findUnique({
    where: { proposal_id: entityId },
    select: {
      proposal_id: true,
      acq_mode_id: true,
      proj_cd: true,
      current_stage_cd: true,
      total_employment_cost_est: true,
    }
  })

  if (!proposal) {
    return { isSuccess: false, error: new Error(`Proposal not found for ID: ${entityId}`) }
  }

  // 2. Fetch Plot Schedules and Land Types
  const plots = await db.plot_schedule.findMany({
    where: { proposal_id: entityId },
    select: {
      plot_schedule_land_type: {
        select: {
          landt_id: true,
          area_to_acquire: true
        }
      }
    }
  })

  // Extract all landt_ids
  const landtIds = new Set<string>()
  plots.forEach(p => {
    p.plot_schedule_land_type.forEach(lt => {
      landtIds.add(String(lt.landt_id))
    })
  })

  // Fetch Land Type Master Names
  const landTypes = await (db.landtype as any).findMany({
    where: {
      landt_id: {
        in: Array.from(landtIds).map(id => BigInt(id))
      }
    }
  })

  const typeNameMap = new Map<string, string>()
  if (Array.isArray(landTypes)) {
    landTypes.forEach((lt: any) => {
      const slug = lt.land_type_slug ? String(lt.land_type_slug).toLowerCase() : ''
      const name = lt.land_type_name_en ? String(lt.land_type_name_en).toLowerCase() : ''
      typeNameMap.set(String(lt.landt_id), `${slug} ${name}`)
    })
  }

  // 3. Derived Land Classification Flags
  let has_tribal_land = false
  let has_debottar_land = false
  let has_displacement = false
  let has_forest_land = false
  let has_tenancy_land = false
  let has_govt_land = false
  let has_patta_land = false
  let has_disputed_land = false

  for (const p of plots) {
    for (const lt of p.plot_schedule_land_type) {
      const typeName = typeNameMap.get(String(lt.landt_id))
      if (typeName) {
        if (typeName.includes('tribal') || typeName.includes('cnt') || typeName.includes('spt')) has_tribal_land = true
        if (typeName.includes('debottar') || typeName.includes('deity')) has_debottar_land = true
        if (typeName.includes('habitation') || typeName.includes('bastu') || typeName.includes('residential') || typeName.includes('ghar') || typeName.includes('house')) has_displacement = true
        if (typeName.includes('forest')) has_forest_land = true
        if (typeName.includes('tenancy') || typeName.includes('raiyati') || typeName.includes('rayati')) has_tenancy_land = true
        if (typeName.includes('govt') || typeName.includes('gair majarua') || typeName.includes('gm')) has_govt_land = true
        if (typeName.includes('patta')) {
          has_govt_land = true
          has_patta_land = true
        }
      }
    }
  }

  // 4. Check project data for clearances and employment
  let has_statutory_clearances = false
  let has_employment_involvement = false
  
  if (proposal.proj_cd) {
    const project = await db.project.findUnique({
      where: { projCd: proposal.proj_cd }
    })

    if (project) {
      if (project.statutoryClearances && Object.keys(project.statutoryClearances as object).length > 0) {
        has_statutory_clearances = true
      }
      if ((project.totalEmpSanctioned && project.totalEmpSanctioned > 0) || (proposal.total_employment_cost_est && Number(proposal.total_employment_cost_est) > 0)) {
        has_employment_involvement = true
      }
    }
  }

  // 5. Fetch authoritative entity_flags
  const flags = await (db as any).entity_flag?.findMany({
    where: {
      entity_type: ACQ_LAND_SCHEDULE,
      entity_id: entityId,
    }
  }).catch(() => [])

  const flagMap: Record<string, any> = {}
  if (Array.isArray(flags)) {
    for (const f of flags) {
      flagMap[f.flag_code] = f.flag_value
    }
  }

  const has_formal_negotiation = flagMap['has_formal_negotiation'] ?? (Number(proposal.acq_mode_id) === 6)

  // 6. Construct Context Object (lowercase keys)
  const contextData = {
    has_tribal_land: flagMap['has_tribal_land'] ?? has_tribal_land,
    has_debottar_land: flagMap['has_debottar_land'] ?? has_debottar_land,
    has_displacement,
    has_forest_land,
    has_tenancy_land,
    has_govt_land,
    has_patta_land,
    has_disputed_land: flagMap['is_disputed_land'] ?? has_disputed_land,
    has_statutory_clearances,
    has_employment_involvement,
    has_formal_negotiation,
    
    // Core proposal properties that shouldn't change without a proposal update
    acqModeId: Number(proposal.acq_mode_id),
    is_rfctlarr: Number(proposal.acq_mode_id) === 2,
    is_board_approval_req: flagMap['requires_board_approval'] ?? true,
    stage: proposal.current_stage_cd
  }

  const targetCheckableType = ACQ_LAND_SCHEDULE
  
  // 7. Upsert into checklist_entity_context
  await db.checklist_entity_context.upsert({
    where: {
      checkable_type_checkable_id: {
        checkable_type: targetCheckableType,
        checkable_id: entityId
      }
    },
    update: {
      context_data: contextData,
      updt_ts: new Date()
    },
    create: {
      checkable_type: targetCheckableType,
      checkable_id: entityId,
      context_data: contextData
    }
  })

  return { isSuccess: true }
}
