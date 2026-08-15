import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ManualMilestoneService } from '@/core/workflow/services/ManualMilestoneService'
import { db } from '@/lib/db'
import { auditQueue } from '@/infrastructure/di/modules/core.di'

vi.mock('@/lib/db', () => ({
  db: {
    manual_milestone: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    milestone_definition: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    workflow_reaction: {
      findMany: vi.fn(),
    },
    acq_proposal: {
      findUnique: vi.fn(),
    },
    proposal_snapshot: {
      create: vi.fn(),
    }
  }
}))

vi.mock('@/infrastructure/di/modules/core.di', () => ({
  auditQueue: {
    push: vi.fn(),
  },
  Container: {}
}))

vi.mock('@/core/workflow/services/WorkflowReactionService', () => ({
  workflowReactionService: {
    handleEvent: vi.fn().mockResolvedValue([]),
    findReactions: vi.fn().mockResolvedValue([])
  }
}))

describe('ManualMilestoneService Flow Unit Tests', () => {
  let milestoneService: ManualMilestoneService

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked((db as any).workflow_reaction.findMany).mockResolvedValue([])
    vi.mocked((db as any).milestone_definition.findFirst).mockImplementation(({ where }: any) => {
      if (where?.milestone_code === 'SECTION_7_NOTIFICATION') {
        return Promise.resolve({
          milestone_code: 'SECTION_7_NOTIFICATION',
          name: 'Section 7 Gazette Notification',
          milestone_dependency_milestone_dependency_milestone_idTomilestone_definition: [
            {
              is_required: true,
              milestone_definition_milestone_dependency_required_milestone_idTomilestone_definition: {
                milestone_code: 'SECTION_4_NOTIFICATION',
                name: 'Section 4 Gazette Notification'
              }
            }
          ]
        })
      }
      if (where?.milestone_code === 'SALE_DEED_REGISTRATION') {
        return Promise.resolve({
          milestone_code: 'SALE_DEED_REGISTRATION',
          name: 'Sale Deed Registration',
          milestone_dependency_milestone_dependency_milestone_idTomilestone_definition: [
            {
              is_required: true,
              milestone_definition_milestone_dependency_required_milestone_idTomilestone_definition: {
                milestone_code: 'STAMP_DUTY_CLEARANCE',
                name: 'Stamp Duty Clearance'
              }
            }
          ]
        })
      }
      return Promise.resolve({
        milestone_code: where?.milestone_code || 'DEFAULT',
        name: 'Default Milestone',
        milestone_dependency_milestone_dependency_milestone_idTomilestone_definition: []
      })
    })
    milestoneService = new ManualMilestoneService()
  })

  describe('CBA Act Milestone Sequence & Dependencies', () => {
    it('should allow recording initial milestone (SECTION_4_NOTIFICATION) with no prerequisites', async () => {
      const mockRecord = {
        id: 'ms_01',
        entity_type: 'PROPOSAL',
        entity_id: 'prop_cba_101',
        milestone_type: 'SECTION_4_NOTIFICATION',
        sent_at: new Date(),
        outcome: 'PUBLISHED_GAZETTE',
      }

      vi.mocked((db as any).manual_milestone.findMany).mockResolvedValue([])
      vi.mocked((db as any).manual_milestone.create).mockResolvedValue(mockRecord)
      vi.mocked((db as any).acq_proposal.findUnique).mockResolvedValue({ proposal_id: 'prop_cba_101', state: 'Drafting' } as any)

      const result = await milestoneService.recordMilestone({
        entity_type: 'PROPOSAL',
        entity_id: 'prop_cba_101',
        milestone_type: 'SECTION_4_NOTIFICATION',
        authority: 'Ministry of Coal',
        reference_no: 'GAZ-2026-001',
        milestone_date: new Date(),
        outcome: 'PUBLISHED_GAZETTE',
        user_id: 'user_admin',
      })

      expect(result.isSuccess).toBe(true)
      expect((db as any).manual_milestone.create).toHaveBeenCalled()
    })

    it('should reject dependent milestone (SECTION_7_NOTIFICATION) if prerequisite (SECTION_4_NOTIFICATION) is missing', async () => {
      // Existing history is empty
      vi.mocked((db as any).manual_milestone.findMany).mockResolvedValue([])

      const result = await milestoneService.recordMilestone({
        entity_type: 'PROPOSAL',
        entity_id: 'prop_cba_101',
        milestone_type: 'SECTION_7_NOTIFICATION',
        authority: 'Ministry of Coal',
        reference_no: 'GAZ-2026-007',
        milestone_date: new Date(),
        outcome: 'GAZETTE_NOTIFIED',
        user_id: 'user_admin',
      })

      expect(result.isFailure).toBe(true)
      expect(String(result.error)).toContain('Missing prerequisite milestones')
      expect(String(result.error)).toContain('Section 4 Gazette Notification')
      expect((db as any).manual_milestone.create).not.toHaveBeenCalled()
    })

    it('should allow dependent milestone (SECTION_7_NOTIFICATION) once prerequisite (SECTION_4_NOTIFICATION) is recorded', async () => {
      // Existing history contains SECTION_4_NOTIFICATION
      vi.mocked((db as any).manual_milestone.findMany).mockResolvedValue([
        {
          id: 'ms_01',
          milestone_type: 'SECTION_4_NOTIFICATION',
          sent_at: new Date(),
        }
      ] as any)

      const mockSec7Record = {
        id: 'ms_02',
        entity_type: 'PROPOSAL',
        entity_id: 'prop_cba_101',
        milestone_type: 'SECTION_7_NOTIFICATION',
        sent_at: new Date(),
      }

      vi.mocked((db as any).manual_milestone.create).mockResolvedValue(mockSec7Record)
      vi.mocked((db as any).acq_proposal.findUnique).mockResolvedValue({ proposal_id: 'prop_cba_101', state: 'Section4Notified' } as any)

      const result = await milestoneService.recordMilestone({
        entity_type: 'PROPOSAL',
        entity_id: 'prop_cba_101',
        milestone_type: 'SECTION_7_NOTIFICATION',
        authority: 'Ministry of Coal',
        reference_no: 'GAZ-2026-007',
        milestone_date: new Date(),
        outcome: 'GAZETTE_NOTIFIED',
        user_id: 'user_admin',
      })

      expect(result.isSuccess).toBe(true)
      expect((db as any).manual_milestone.create).toHaveBeenCalled()
    })
  })

  describe('Direct Purchase Milestone Sequence & Dependencies', () => {
    it('should enforce STAMP_DUTY_CLEARANCE prerequisite on SALE_DEED_REGISTRATION', async () => {
      vi.mocked((db as any).manual_milestone.findMany).mockResolvedValue([])

      const result = await milestoneService.recordMilestone({
        entity_type: 'PROPOSAL',
        entity_id: 'prop_dp_202',
        milestone_type: 'SALE_DEED_REGISTRATION',
        milestone_date: new Date(),
        outcome: 'CLEARED',
        user_id: 'user_legal',
      })

      expect(result.isFailure).toBe(true)
      expect(String(result.error)).toContain('Sale Deed Registration')
    })
  })

  describe('Milestone History Retrieval', () => {
    it('should fetch milestone history ordered chronologically', async () => {
      const mockHistory = [
        { id: 'ms_01', milestone_type: 'SECTION_4_NOTIFICATION', sent_at: new Date('2026-01-01') },
        { id: 'ms_02', milestone_type: 'SECTION_7_NOTIFICATION', sent_at: new Date('2026-03-01') }
      ]

      vi.mocked((db as any).manual_milestone.findMany).mockResolvedValue(mockHistory as any)

      const result = await milestoneService.getHistory('PROPOSAL', 'prop_cba_101')

      expect(result.isSuccess).toBe(true)
      expect(result.value!).toHaveLength(2)
      expect(result.value![0].milestone_type).toBe('SECTION_4_NOTIFICATION')
    })
  })
})
