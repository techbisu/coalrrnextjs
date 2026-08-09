import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GetChecklistStatusUseCase } from '@/core/checklist/usecases/GetChecklistStatusUseCase'
import { IChecklistRepository } from '@/core/checklist/interfaces/IChecklistRepository'
import { ChecklistContextRegistry } from '@/core/checklist/registry/ChecklistContextRegistry'
import { ACQ_LAND_SCHEDULE, MODULE_CODES } from '@/core/config/module-codes.config'

describe('Checklist Flow Unit Tests', () => {
  let mockRepo: IChecklistRepository
  let mockRegistry: ChecklistContextRegistry
  let useCase: GetChecklistStatusUseCase

  beforeEach(() => {
    mockRepo = {
      findRulesByModule: vi.fn(),
      findSubmissions: vi.fn(),
      findSubmission: vi.fn(),
      upsertSubmission: vi.fn(),
    }

    mockRegistry = new ChecklistContextRegistry()
    mockRegistry.register(MODULE_CODES.LAND_SCHEDULE, {
      resolve: vi.fn().mockResolvedValue({
        acq_mode_id: 6, // Direct Purchase
        projectId: 'proj_101',
      })
    })

    useCase = new GetChecklistStatusUseCase(mockRepo, mockRegistry)
  })

  it('should filter checklist rules based on show_if condition (Direct Purchase acq_mode_id = 6)', async () => {
    const rules = [
      {
        id: 'rule_01',
        chk_id: 'rule_01',
        chk_code: 'PROP_CL_001',
        title: 'Title Search Report',
        is_mandatory: true,
        show_if: { acq_mode_id: 6 },
      },
      {
        id: 'rule_02',
        chk_id: 'rule_02',
        chk_code: 'PROP_CL_002',
        title: 'CBA Section 4 Notification',
        is_mandatory: true,
        show_if: { acq_mode_id: 1 }, // CBA Act mode only
      }
    ]

    vi.spyOn(mockRepo, 'findRulesByModule').mockResolvedValue(rules as any)
    vi.spyOn(mockRepo, 'findSubmissions').mockResolvedValue([])

    const result = await useCase.execute({
      moduleCode: MODULE_CODES.LAND_SCHEDULE,
      checkableType: ACQ_LAND_SCHEDULE,
      checkableId: 'proposal_123',
    })

    expect(result.isSuccess).toBe(true)
    const data = result.value
    // Should include rule_01 (acq_mode_id = 6) and exclude rule_02 (acq_mode_id = 1)
    expect(data.items).toHaveLength(1)
    expect(data.items[0].ruleId).toBe('rule_01')
    expect(data.isComplete).toBe(false)
  })

  it('should mark checklist complete when all mandatory items have valid submissions', async () => {
    const rules = [
      {
        id: 'rule_01',
        chk_id: 'rule_01',
        chk_code: 'PROP_CL_001',
        title: 'Title Search Report',
        is_mandatory: true,
        show_if: { acq_mode_id: 6 },
      }
    ]

    const submissions = [
      {
        requirement_id: 'rule_01',
        checkable_type: ACQ_LAND_SCHEDULE,
        checkable_id: 'proposal_123',
        status: 'SUBMITTED',
      }
    ]

    vi.spyOn(mockRepo, 'findRulesByModule').mockResolvedValue(rules as any)
    vi.spyOn(mockRepo, 'findSubmissions').mockResolvedValue(submissions as any)

    const result = await useCase.execute({
      moduleCode: MODULE_CODES.LAND_SCHEDULE,
      checkableType: ACQ_LAND_SCHEDULE,
      checkableId: 'proposal_123',
    })

    expect(result.isSuccess).toBe(true)
    const data = result.value
    expect(data.isComplete).toBe(true)
    expect(data.items).toHaveLength(1)
    expect(data.items[0].submission.status).toBe('SUBMITTED')
  })

  it('should support inherit_from parent checklist submissions automatically', async () => {
    const rules = [
      {
        id: 'rule_03',
        chk_id: 'rule_03',
        chk_code: 'PROP_CL_003',
        title: 'Project Feasibility Certificate',
        is_mandatory: true,
        show_if: { acq_mode_id: 6 },
        inherit_from: {
          parent_checkable_type: 'PROJECT',
          parent_rule_id: 'rule_03'
        }
      }
    ]

    mockRegistry.register(MODULE_CODES.LAND_SCHEDULE, {
      resolve: vi.fn().mockResolvedValue({
        acq_mode_id: 6,
        parentId: 'project_999'
      })
    })

    vi.spyOn(mockRepo, 'findRulesByModule').mockResolvedValue(rules as any)
    vi.spyOn(mockRepo, 'findSubmissions').mockResolvedValue([])
    vi.spyOn(mockRepo, 'findSubmission').mockResolvedValue({
      requirement_id: 'rule_03',
      checkable_type: 'PROJECT',
      checkable_id: 'project_999',
      status: 'APPROVED'
    } as any)

    const result = await useCase.execute({
      moduleCode: MODULE_CODES.LAND_SCHEDULE,
      checkableType: ACQ_LAND_SCHEDULE,
      checkableId: 'proposal_123',
    })

    expect(result.isSuccess).toBe(true)
    const data = result.value
    expect(data.isComplete).toBe(true)
    expect(data.items[0].submission.status).toBe('AUTO_SATISFIED')
  })
})
