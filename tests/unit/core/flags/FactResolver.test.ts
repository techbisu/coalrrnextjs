import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FactResolver } from '@/core/flags/services/FactResolver'
import { ConditionContextBuilder } from '@/core/flags/services/ConditionContextBuilder'
import { PrismaEntityFlagRepository } from '@/core/flags/infrastructure/persistence/PrismaEntityFlagRepository'
import { AcqLandScheduleFactAdapter } from '@/core/flags/adapters/AcqLandScheduleFactAdapter'
import { ProjectFactAdapter } from '@/core/flags/adapters/ProjectFactAdapter'
import { CHECKABLE_ENTITY_TYPES } from '@/core/config/module-codes.config'
import { v4 as uuidv4 } from 'uuid'

// Mock Stores
const proposalStore = new Map<string, any>()
const plotScheduleStore = new Map<string, any[]>()
const projectStore = new Map<string, any>()
const flagStore = new Map<string, any>()

// Mock Prisma Client
vi.mock('@/lib/db', () => ({
  db: {
    entity_flag: {
      findUnique: vi.fn(async ({ where }) => {
        const key = `${where.entity_type_entity_id_flag_code.entity_type}:${where.entity_type_entity_id_flag_code.entity_id}:${where.entity_type_entity_id_flag_code.flag_code}`
        return flagStore.get(key) || null
      }),
      upsert: vi.fn(async ({ where, create, update }) => {
        const selector = where.entity_type_entity_id_flag_code
        const key = `${selector.entity_type}:${selector.entity_id}:${selector.flag_code}`
        const existing = flagStore.get(key)

        if (existing) {
          const updatedRecord = { ...existing, ...update, updt_ts: new Date() }
          flagStore.set(key, updatedRecord)
          return updatedRecord
        } else {
          const newRecord = { id: uuidv4(), ...create, entry_ts: new Date(), updt_ts: new Date() }
          flagStore.set(key, newRecord)
          return newRecord
        }
      }),
      findMany: vi.fn(async ({ where }) => {
        return Array.from(flagStore.values()).filter(
          (item) => item.entity_type === where.entity_type && item.entity_id === where.entity_id
        )
      }),
    },
    acq_proposal: {
      findUnique: vi.fn(async ({ where }) => {
        return proposalStore.get(where.proposal_id) || null
      }),
    },
    plot_schedule: {
      count: vi.fn(async ({ where }) => {
        const plots = plotScheduleStore.get(where.proposal_id) || []
        return plots.length
      }),
    },
    project: {
      findUnique: vi.fn(async ({ where }) => {
        return projectStore.get(where.proj_cd || where.projCd) || null
      }),
    },
  },
}))

describe('FactResolver & ConditionContext Engine (Phase 2)', () => {
  let flagRepo: PrismaEntityFlagRepository
  let factResolver: FactResolver
  let contextBuilder: ConditionContextBuilder

  beforeEach(() => {
    proposalStore.clear()
    plotScheduleStore.clear()
    projectStore.clear()
    flagStore.clear()

    flagRepo = new PrismaEntityFlagRepository()
    factResolver = new FactResolver(flagRepo)
    factResolver.registerAdapter(new AcqLandScheduleFactAdapter())
    factResolver.registerAdapter(new ProjectFactAdapter())

    contextBuilder = new ConditionContextBuilder(factResolver)
  })

  it('1. should resolve merged facts (Domain Data + Derived Facts + Stored Flags) for acq_land_schedule', async () => {
    const proposalId = uuidv4()

    // 1. Domain data
    proposalStore.set(proposalId, {
      proposal_id: proposalId,
      acq_mode_id: 1, // CBA Act
      current_stage_cd: 'Drafting',
      tot_acq_area: '150.5',
      proj_cd: 'PROJ_001',
    })

    // 2. Derived facts (3 plots)
    plotScheduleStore.set(proposalId, [{ id: 1 }, { id: 2 }, { id: 3 }])

    // 3. Stored persisted flags in entity_flag
    await flagRepo.set(CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE, proposalId, 'requires_board_approval', false)
    await flagRepo.set(CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE, proposalId, 'has_forest_land', true)

    const context = await contextBuilder.buildContext(CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE, proposalId)

    expect(context.entityType).toBe(CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE)
    expect(context.entityId).toBe(proposalId)

    // Authoritative domain data & flags
    expect(context.get('acq_mode_id')).toBe(1)
    expect(context.get('current_stage_cd')).toBe('Drafting')
    expect(context.getBoolean('requires_board_approval')).toBe(false)

    // Derived facts
    expect(context.get('plot_count')).toBe(3)
    expect(context.getBoolean('has_plots')).toBe(true)

    // Persisted entity_flag
    expect(context.getBoolean('has_forest_land')).toBe(true)
  })

  it('2. should resolve authoritative entity_flag values for proposal conditional flags', async () => {
    const proposalId = uuidv4()

    proposalStore.set(proposalId, {
      proposal_id: proposalId,
      acq_mode_id: 2,
    })

    // Authoritative flags stored in entity_flag
    await flagRepo.set(CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE, proposalId, 'has_tribal_land', true, {
      source: 'USER',
    })

    const context = await contextBuilder.buildContext(CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE, proposalId)

    expect(context.getBoolean('has_tribal_land')).toBe(true)
  })

  it('3. should support ConditionContext helper methods (get, getBoolean, has, toDictionary)', async () => {
    const projectCd = 'PROJ_ECL_777'

    projectStore.set(projectCd, {
      proj_cd: projectCd,
      proj_nm: 'Rajmahal Open Cast Expansion',
      status: 'Active',
      target_area_acres: 500,
      budget_ceiling: 1200000000,
    })

    const context = await contextBuilder.buildContext(CHECKABLE_ENTITY_TYPES.PROJECT, projectCd)

    expect(context.has('proj_nm')).toBe(true)
    expect(context.has('non_existent_key')).toBe(false)

    expect(context.get('proj_nm')).toBe('Rajmahal Open Cast Expansion')
    expect(context.get('non_existent_key', 'DEFAULT_VAL')).toBe('DEFAULT_VAL')

    expect(context.getBoolean('non_existent_key')).toBe(false)
    expect(context.getBoolean('non_existent_key', true)).toBe(true)

    const dict = context.toDictionary()
    expect(dict.proj_cd).toBe(projectCd)
    expect(dict.target_area_acres).toBe(500)
  })

  it('4. should gracefully resolve facts when no domain adapter exists for entity_type', async () => {
    const payrollId = uuidv4()

    await flagRepo.set(CHECKABLE_ENTITY_TYPES.COMPENSATION_PAYROLL, payrollId, 'is_audit_cleared', true)
    await flagRepo.set(CHECKABLE_ENTITY_TYPES.COMPENSATION_PAYROLL, payrollId, 'batch_count', 42)

    const context = await contextBuilder.buildContext(CHECKABLE_ENTITY_TYPES.COMPENSATION_PAYROLL, payrollId)

    expect(context.getBoolean('is_audit_cleared')).toBe(true)
    expect(context.get('batch_count')).toBe(42)
  })

  it('5. should normalize module code strings like LAND_SCHEDULE or PROJECT to canonical entity_type', async () => {
    const proposalId = uuidv4()

    proposalStore.set(proposalId, {
      proposal_id: proposalId,
      acq_mode_id: 1,
    })

    await flagRepo.set(CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE, proposalId, 'has_formal_negotiation', true)

    const context = await contextBuilder.buildContext('LAND_SCHEDULE', proposalId)

    expect(context.entityType).toBe(CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE)
    expect(context.getBoolean('has_formal_negotiation')).toBe(true)
  })
})
