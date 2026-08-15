import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EntityFlagService } from '@/core/flags/services/EntityFlagService'
import { PrismaEntityFlagRepository } from '@/core/flags/infrastructure/persistence/PrismaEntityFlagRepository'
import { CHECKABLE_ENTITY_TYPES, MODULE_CODES } from '@/core/config/module-codes.config'
import { v4 as uuidv4 } from 'uuid'

// In-memory database store for unit testing
const flagStore = new Map<string, any>()

vi.mock('@/lib/db', () => ({
  db: {
    entity_flag: {
      upsert: vi.fn(async ({ where, update, create }) => {
        const selector = where.entity_type_entity_id_flag_code
        const key = `${selector.entity_type}:${selector.entity_id}:${selector.flag_code}`
        const existing = flagStore.get(key)

        if (existing) {
          const updatedRecord = {
            ...existing,
            ...update,
            flag_value: update.flag_value !== undefined ? update.flag_value : existing.flag_value,
            updt_ts: new Date(),
          }
          flagStore.set(key, updatedRecord)
          return updatedRecord
        } else {
          const newRecord = {
            id: uuidv4(),
            ...create,
            entry_ts: new Date(),
            updt_ts: new Date(),
          }
          flagStore.set(key, newRecord)
          return newRecord
        }
      }),

      findUnique: vi.fn(async ({ where }) => {
        const selector = where.entity_type_entity_id_flag_code
        const key = `${selector.entity_type}:${selector.entity_id}:${selector.flag_code}`
        return flagStore.get(key) || null
      }),

      findMany: vi.fn(async ({ where }) => {
        const results = Array.from(flagStore.values()).filter(
          (item) => item.entity_type === where.entity_type && item.entity_id === where.entity_id
        )
        return results
      }),

      delete: vi.fn(async ({ where }) => {
        const selector = where.entity_type_entity_id_flag_code
        const key = `${selector.entity_type}:${selector.entity_id}:${selector.flag_code}`
        if (!flagStore.has(key)) throw new Error('Record not found')
        flagStore.delete(key)
        return { id: key }
      }),

      count: vi.fn(async ({ where }) => {
        const results = Array.from(flagStore.values()).filter((item) => {
          if (where.entity_type && item.entity_type !== where.entity_type) return false
          if (where.entity_id && item.entity_id !== where.entity_id) return false
          if (where.flag_code && item.flag_code !== where.flag_code) return false
          return true
        })
        return results.length
      }),
    },
  },
}))

describe('EntityFlagService & Storage Suite (Phase 1)', () => {
  let repository: PrismaEntityFlagRepository
  let service: EntityFlagService

  beforeEach(() => {
    flagStore.clear()
    repository = new PrismaEntityFlagRepository()
    service = new EntityFlagService(repository)
  })

  it('A & B. should create and read a flag for acq_land_schedule (UUID entity_id)', async () => {
    const proposalId = uuidv4()
    const flagCode = 'has_forest_land'

    const created = await service.set(
      CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE,
      proposalId,
      flagCode,
      true,
      { source: 'LAND_SCHEDULE' }
    )

    expect(created).toBeDefined()
    expect(created.entity_type).toBe(CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE)
    expect(created.entity_id).toBe(proposalId)
    expect(created.flag_code).toBe(flagCode)
    expect(created.flag_value).toBe(true)

    const read = await service.get(CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE, proposalId, flagCode)
    expect(read).toBeDefined()
    expect(read?.flag_value).toBe(true)
  })

  it('C & D. should atomically update an existing flag without creating duplicate rows', async () => {
    const proposalId = uuidv4()
    const flagCode = 'has_govt_land'

    // First write: true
    await service.set(CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE, proposalId, flagCode, true)

    // Second write: false
    const updated = await service.set(CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE, proposalId, flagCode, false)
    expect(updated.flag_value).toBe(false)

    // Check count of flags for this entity
    const allFlags = await service.getAll(CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE, proposalId)
    const matchingFlags = allFlags.filter((f) => f.flag_code === flagCode)
    expect(matchingFlags.length).toBe(1)
    expect(matchingFlags[0].flag_value).toBe(false)
  })

  it('E. should store multiple distinct flags for the same entity', async () => {
    const proposalId = uuidv4()

    await service.set(CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE, proposalId, 'has_forest_land', true)
    await service.set(CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE, proposalId, 'has_govt_land', false)
    await service.set(CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE, proposalId, 'has_tenancy_land', true)

    const allFlags = await service.getAll(CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE, proposalId)
    expect(allFlags.length).toBe(3)
    const codes = allFlags.map((f) => f.flag_code).sort()
    expect(codes).toEqual(['has_forest_land', 'has_govt_land', 'has_tenancy_land'])
  })

  it('F. should store same flag code across multiple distinct entities independently', async () => {
    const proposalA = uuidv4()
    const proposalB = uuidv4()
    const flagCode = 'is_disputed_land'

    await service.set(CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE, proposalA, flagCode, true)
    await service.set(CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE, proposalB, flagCode, false)

    const flagA = await service.get(CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE, proposalA, flagCode)
    const flagB = await service.get(CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE, proposalB, flagCode)

    expect(flagA?.flag_value).toBe(true)
    expect(flagB?.flag_value).toBe(false)
  })

  it('G. should support different canonical entity types independently using real canonical IDs', async () => {
    const proposalId = uuidv4() // acq_land_schedule
    const projectCd = 'PROJ_ECL_001' // project
    const payrollId = uuidv4() // compensation_payroll

    await service.set(CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE, proposalId, 'requires_board_approval', true)
    await service.set(CHECKABLE_ENTITY_TYPES.PROJECT, projectCd, 'requires_board_approval', false)
    await service.set(CHECKABLE_ENTITY_TYPES.COMPENSATION_PAYROLL, payrollId, 'requires_board_approval', true)

    const propFlag = await service.get(CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE, proposalId, 'requires_board_approval')
    const projFlag = await service.get(CHECKABLE_ENTITY_TYPES.PROJECT, projectCd, 'requires_board_approval')
    const payFlag = await service.get(CHECKABLE_ENTITY_TYPES.COMPENSATION_PAYROLL, payrollId, 'requires_board_approval')

    expect(propFlag?.flag_value).toBe(true)
    expect(projFlag?.flag_value).toBe(false)
    expect(payFlag?.flag_value).toBe(true)
  })

  it('H. should support varied JSONB data types (boolean, number, string, array, object)', async () => {
    const entityId = uuidv4()
    const entityType = CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE

    await service.set(entityType, entityId, 'flag_bool', true)
    await service.set(entityType, entityId, 'flag_num', 45.25)
    await service.set(entityType, entityId, 'flag_str', 'PACKAGE_DEAL')
    await service.set(entityType, entityId, 'flag_arr', ['CAT_A', 'CAT_B'])
    await service.set(entityType, entityId, 'flag_obj', { key: 'value', limit: 100 })

    expect((await service.get(entityType, entityId, 'flag_bool'))?.flag_value).toBe(true)
    expect((await service.get(entityType, entityId, 'flag_num'))?.flag_value).toBe(45.25)
    expect((await service.get(entityType, entityId, 'flag_str'))?.flag_value).toBe('PACKAGE_DEAL')
    expect((await service.get(entityType, entityId, 'flag_arr'))?.flag_value).toEqual(['CAT_A', 'CAT_B'])
    expect((await service.get(entityType, entityId, 'flag_obj'))?.flag_value).toEqual({ key: 'value', limit: 100 })
  })

  it('I. should store and retrieve flag metadata correctly', async () => {
    const proposalId = uuidv4()
    const flagCode = 'has_forest_land'

    const record = await service.set(
      CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE,
      proposalId,
      flagCode,
      true,
      {
        source: 'USER',
        entryBy: 'user_102',
      }
    )

    expect(record.source).toBe('USER')
    expect(record.entry_by).toBe('user_102')
  })

  it('J. should reject invalid or unmapped entity types', async () => {
    const entityId = uuidv4()
    await expect(
      service.set('UNRECOGNIZED_ENTITY_TYPE', entityId, 'some_flag', true)
    ).rejects.toThrow(/Invalid entity_type/)
  })

  it('K. should enforce required fields validation', async () => {
    await expect(
      service.set(CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE, '', 'some_flag', true)
    ).rejects.toThrow()

    await expect(
      service.set(CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE, uuidv4(), '', true)
    ).rejects.toThrow()
  })

  it('L. should normalize canonical module codes like LAND_SCHEDULE or LAND_ACQ_PROPOSAL to acq_land_schedule', async () => {
    const proposalId = uuidv4()
    const flagCode = 'has_tribal_land'

    // Pass MODULE_CODES.LAND_SCHEDULE ('LAND_SCHEDULE')
    await service.set(MODULE_CODES.LAND_SCHEDULE, proposalId, flagCode, true)

    // Retrieve via CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE ('acq_land_schedule')
    const record = await service.get(CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE, proposalId, flagCode)
    expect(record).toBeDefined()
    expect(record?.flag_value).toBe(true)
    expect(record?.entity_type).toBe(CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE)
  })
})
