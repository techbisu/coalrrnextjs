import { db } from '@/lib/db'
import { MODULE_CODES, ACQ_LAND_SCHEDULE, normalizeModuleCode } from '@/core/config/module-codes.config'

export interface SyncChecklistContextPayload {
  moduleCode: string
  entityId: string
}

export const syncChecklistContextHandler = async (payload: SyncChecklistContextPayload): Promise<void> => {
  const { moduleCode, entityId } = payload
  
  if (normalizeModuleCode(moduleCode) !== MODULE_CODES.LAND_SCHEDULE) {
    console.log(`[syncChecklistContext] Skipping unsupported module: ${moduleCode}`)
    return
  }
  
  console.log(`[syncChecklistContext] Syncing context for ${moduleCode} ID: ${entityId}`)

  // 1. Fetch proposal and plots
  const proposal = await db.acq_proposal.findUnique({
    where: { proposal_id: entityId },
    include: {
      plot_schedule: {
        include: {
          plot_schedule_land_type: true
        }
      }
    }
  })

  if (!proposal) {
    console.warn(`[syncChecklistContext] Proposal not found: ${entityId}`)
    return
  }

  // 2. Initialize flags
  let has_tribal_land = proposal.has_tribal_land ?? false
  let has_debottar_land = proposal.has_debottar_land ?? false
  let has_displacement = false
  let has_forest_land = false
  let has_tenancy_land = false
  let has_govt_land = false
  let has_patta_land = false // Extra check for patta land if needed
  let has_disputed_land = proposal.is_disputed_land ?? false

  // 3. Scan plots and land types
  const plots = proposal.plot_schedule || []
  
  // To avoid hitting the DB in a loop, fetch all unique land type IDs
  const landTypeIds = new Set<string>()
  for (const plot of plots) {
    for (const lt of (plot as any).plot_schedule_land_type || []) {
      if (lt.landt_id) {
        landTypeIds.add(String(lt.landt_id))
      }
    }
  }

  const masterTypes = await db.landtype.findMany({
    where: {
      landt_id: { in: Array.from(landTypeIds).map(id => BigInt(id)) }
    }
  })

  // Map for easy lookup
  const typeNameMap = new Map<string, string>()
  for (const mt of masterTypes) {
    typeNameMap.set(String(mt.landt_id), mt.land_type.toLowerCase())
  }

  // Process plots
  for (const plot of plots) {
    const lts = (plot as any).plot_schedule_land_type || []
    for (const lt of lts) {
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

  const has_formal_negotiation = proposal.has_formal_negotiation ?? (Number(proposal.acq_mode_id) === 6)

  // 5. Construct Context Object (lowercase keys)
  const contextData = {
    has_tribal_land,
    has_debottar_land,
    has_displacement,
    has_forest_land,
    has_tenancy_land,
    has_govt_land,
    has_patta_land,
    has_disputed_land,
    has_statutory_clearances,
    has_employment_involvement,
    has_formal_negotiation,
    
    // Core proposal properties that shouldn't change without a proposal update
    acqModeId: Number(proposal.acq_mode_id),
    is_rfctlarr: Number(proposal.acq_mode_id) === 2,
    is_board_approval_req: proposal.requires_board_approval,
    stage: proposal.current_stage_cd
  }

  const targetCheckableType = ACQ_LAND_SCHEDULE
  
  // 6. Upsert into checklist_entity_context
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

  console.log(`[syncChecklistContext] Successfully synced context for ${moduleCode} ID: ${entityId}`)
}
