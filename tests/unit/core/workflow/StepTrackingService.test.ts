import { describe, it, expect, vi, beforeEach } from 'vitest'
import { StepTrackingService } from '@/core/workflow/services/StepTrackingService'
import { StepsCompletedGuard } from '@/core/workflow/guards'
import { MODULE_CODES, CHECKABLE_ENTITY_TYPES } from '@/core/config/module-codes.config'

vi.mock('@/lib/db', () => ({
  db: {
    process_step_tracking: {
      upsert: vi.fn().mockImplementation(({ create }) => Promise.resolve({ id: 'step-1', ...create })),
      update: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'step-1', ...data })),
      count: vi.fn().mockResolvedValue(0),
      findMany: vi.fn().mockResolvedValue([
        { id: 'step-1', step_group: 'FORM_VII_SIGNATURES', step_key: 'pur_land_clerk', status: 'COMPLETED' },
      ]),
    },
    outbox_events: {
      create: vi.fn().mockResolvedValue({ id: 'event-1' }),
    },
  },
}))

describe('StepTrackingService Unit Tests', () => {
  let service: StepTrackingService

  beforeEach(() => {
    service = new StepTrackingService()
  })

  it('should initialize micro-step tracking records for LAND_SCHEDULE', async () => {
    const result = await service.initializeSteps(
      MODULE_CODES.LAND_SCHEDULE,
      CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE,
      'prop-101',
      'inst-101'
    )

    expect(result.isSuccess).toBe(true)
    expect(result.value!.length).toBeGreaterThan(0)
  })

  it('should complete a micro-step and report group status', async () => {
    const result = await service.completeStep({
      entityType: CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE,
      entityId: 'prop-101',
      stepGroup: 'FORM_VII_SIGNATURES',
      stepKey: 'pur_land_clerk',
      userId: 1,
      remarks: 'Verified by Land Clerk',
    })

    expect(result.isSuccess).toBe(true)
    expect(result.value!.isGroupComplete).toBe(true)
  })

  it('should evaluate isStepGroupComplete as true when count is 0', async () => {
    const result = await service.isStepGroupComplete(
      CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE,
      'prop-101',
      'FORM_VII_SIGNATURES'
    )

    expect(result.isSuccess).toBe(true)
    expect(result.value).toBe(true)
  })
})

describe('StepsCompletedGuard Unit Tests', () => {
  it('should pass guard check when step group status is true', () => {
    const guard = new StepsCompletedGuard('FORM_VII_SIGNATURES')
    const ctx: any = {
      recordType: MODULE_CODES.LAND_SCHEDULE,
      currentState: 'AreaVetting',
      actorRole: 'area_office',
      userId: '1',
      data: {
        stepGroupStatus: {
          FORM_VII_SIGNATURES: true,
        },
      },
    }

    const res = guard.check(ctx)
    expect(res.ok).toBe(true)
  })

  it('should block transition when step group status is false', () => {
    const guard = new StepsCompletedGuard('FORM_VII_SIGNATURES')
    const ctx: any = {
      recordType: MODULE_CODES.LAND_SCHEDULE,
      currentState: 'AreaVetting',
      actorRole: 'area_office',
      userId: '1',
      data: {
        stepGroupStatus: {
          FORM_VII_SIGNATURES: false,
        },
      },
    }

    const res = guard.check(ctx)
    expect(res.ok).toBe(false)
    expect(res.reason).toContain('incomplete micro-steps')
  })
})
