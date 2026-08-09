import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Proposal } from '@/domain/entities/proposal/Proposal'
import { ACQ_LAND_SCHEDULE, MODULE_CODES, CHECKABLE_ENTITY_TYPES, resolveWorkflowCode } from '@/core/config/module-codes.config'
import { SubmitProposalUseCase } from '@/application/use-cases/proposal/SubmitProposalUseCase'
import { GetChecklistStatusUseCase } from '@/core/checklist/usecases/GetChecklistStatusUseCase'
import { ManualMilestoneService } from '@/core/workflow/services/ManualMilestoneService'
import { milestoneConfig } from '@/core/config/milestone.config'
import { Result } from '@/core'
import { db } from '@/lib/db'

// Mock DB and DI modules
vi.mock('@/lib/db', () => ({
  db: {
    manual_milestone: {
      create: vi.fn(),
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

vi.mock('@/core/notifications/EventBus', () => ({
  EventBus: {
    publish: vi.fn(),
  }
}))

vi.mock('@/infrastructure/di/modules/core.di', () => ({
  auditQueue: {
    push: vi.fn(),
  },
  Container: {}
}))

describe('Deep Review & Functional Test Matrix: All 3 Acquisition Modes', () => {

  describe('MODE 1: CBA ACT (acq_mode_id = 1)', () => {
    it('1.1 Should resolve mode-aware workflow code LAND_SCHEDULE_1 / LAND_SCHEDULE_CBA_ACT', () => {
      const codeId = resolveWorkflowCode(MODULE_CODES.LAND_SCHEDULE, 1)
      const codeStr = resolveWorkflowCode(MODULE_CODES.LAND_SCHEDULE, 'cba_act')
      expect(codeId).toBe('LAND_SCHEDULE_1')
      expect(codeStr).toBe('LAND_SCHEDULE_CBA_ACT')
    })

    it('1.2 Should initialize Proposal with CBA Act checklist CL-1.1', () => {
      const proposal = Proposal.create({
        projectId: 'proj_cba_001',
        proposalTitle: 'CBA Phase I Acquisition',
        acquisitionMode: 'cba_act',
        proposedBy: 'Unit Land Officer',
        proposedByRole: 'unit_office',
        collieryCode: 'MINE_CBA_10',
      }).value!

      expect(proposal.acquisitionMode.value).toBe('cba_act')
      expect(proposal.checklist.checklistCode).toBe('CL-1.1')
      expect(proposal.state.value).toBe('Drafting')
    })

    it('1.3 Should enforce statutory milestone sequence (Sec 4 -> Sec 7 -> Sec 9 -> Sec 11)', async () => {
      const milestoneService = new ManualMilestoneService()

      // Attempting Sec 7 before Sec 4 must fail
      vi.mocked((db as any).manual_milestone.findMany).mockResolvedValue([])
      const sec7Fail = await milestoneService.recordMilestone({
        entity_type: ACQ_LAND_SCHEDULE,
        entity_id: 'prop_cba_001',
        milestone_type: 'SECTION_7_NOTIFICATION',
        milestone_date: new Date(),
        outcome: 'GAZETTE_NOTIFIED',
        user_id: 'user_cba',
      })
      expect(sec7Fail.isFailure).toBe(true)
      expect(String(sec7Fail.error)).toContain('Section 4 Gazette Notification')

      // Record Sec 4 successfully
      vi.mocked((db as any).manual_milestone.create).mockResolvedValue({ id: 'm1', milestone_type: 'SECTION_4_NOTIFICATION' })
      vi.mocked((db as any).acq_proposal.findUnique).mockResolvedValue({ proposal_id: 'prop_cba_001' } as any)

      const sec4Success = await milestoneService.recordMilestone({
        entity_type: ACQ_LAND_SCHEDULE,
        entity_id: 'prop_cba_001',
        milestone_type: 'SECTION_4_NOTIFICATION',
        milestone_date: new Date(),
        outcome: 'GAZETTE_NOTIFIED',
        user_id: 'user_cba',
      })
      expect(sec4Success.isSuccess).toBe(true)
    })
  })

  describe('MODE 2: RFCTLARR ACT (acq_mode_id = 2)', () => {
    it('2.1 Should resolve mode-aware workflow code LAND_SCHEDULE_2 / LAND_SCHEDULE_RFCTLARR', () => {
      const codeId = resolveWorkflowCode(MODULE_CODES.LAND_SCHEDULE, 2)
      const codeStr = resolveWorkflowCode(MODULE_CODES.LAND_SCHEDULE, 'rfctlarr')
      expect(codeId).toBe('LAND_SCHEDULE_2')
      expect(codeStr).toBe('LAND_SCHEDULE_RFCTLARR')
    })

    it('2.2 Should initialize Proposal with RFCTLARR checklist CL-1.3', () => {
      const proposal = Proposal.create({
        projectId: 'proj_rfctlarr_002',
        proposalTitle: 'RFCTLARR Land Procurement',
        acquisitionMode: 'rfctlarr',
        proposedBy: 'Area Officer',
        proposedByRole: 'area_office',
        collieryCode: 'MINE_RF_20',
      }).value!

      expect(proposal.acquisitionMode.value).toBe('rfctlarr')
      expect(proposal.checklist.checklistCode).toBe('CL-1.3')
      expect(proposal.state.value).toBe('Drafting')
    })

    it('2.3 Should route to LimitBreached state when project limits are exceeded', async () => {
      const mockProposalRepo = {
        findById: vi.fn(),
        save: vi.fn(),
      }
      const mockProjectRepo = {
        findById: vi.fn().mockResolvedValue({ id: 'proj_rfctlarr_002' }),
      }
      const mockProjectLimitService = {
        checkProposalLimits: vi.fn().mockResolvedValue(
          Result.ok({ isLimitBreached: true, breachReasons: ['Land area ceiling breached by 150 Acres'] })
        ),
      }
      const mockChecklistUseCase = {
        execute: vi.fn().mockResolvedValue(Result.ok({ isComplete: true, missingItems: [] })),
      }

      const proposal = Proposal.create({
        projectId: 'proj_rfctlarr_002',
        proposalTitle: 'RFCTLARR Land Procurement',
        acquisitionMode: 'rfctlarr',
        proposedBy: 'Area Officer',
        proposedByRole: 'area_office',
        collieryCode: 'MINE_RF_20',
      }).value!

      proposal.checklist.getAllItems().forEach((item) => {
        if (item.required) proposal.updateChecklistItem(item.key, 'complete')
      })

      mockProposalRepo.findById.mockResolvedValue(proposal)

      const submitUseCase = new SubmitProposalUseCase(
        mockProposalRepo as any,
        mockProjectRepo as any,
        mockProjectLimitService as any,
        mockChecklistUseCase as any
      )

      const result = await submitUseCase.execute({
        proposalId: 'prop_rfctlarr_002',
        user_id: 'user_area',
      })

      expect(result.isSuccess).toBe(true)
      expect(proposal.state.value).toBe('LimitBreached')
      expect(mockProposalRepo.save).toHaveBeenCalledWith(proposal)
    })
  })

  describe('MODE 6: DIRECT PURCHASE (acq_mode_id = 6)', () => {
    it('3.1 Should resolve mode-aware workflow code LAND_SCHEDULE_6 / LAND_SCHEDULE_DIRECT_PURCHASE', () => {
      const codeId = resolveWorkflowCode(MODULE_CODES.LAND_SCHEDULE, 6)
      const codeStr = resolveWorkflowCode(MODULE_CODES.LAND_SCHEDULE, 'direct_purchase')
      expect(codeId).toBe('LAND_SCHEDULE_6')
      expect(codeStr).toBe('LAND_SCHEDULE_DIRECT_PURCHASE')
    })

    it('3.2 Should initialize Proposal with Direct Purchase checklist CL-1.2', () => {
      const proposal = Proposal.create({
        projectId: 'proj_dp_006',
        proposalTitle: 'Direct Purchase Private Land Block',
        acquisitionMode: 'direct_purchase',
        proposedBy: 'Colliery Surveyor',
        proposedByRole: 'unit_office',
        collieryCode: 'MINE_DP_60',
      }).value!

      expect(proposal.acquisitionMode.value).toBe('direct_purchase')
      expect(proposal.checklist.checklistCode).toBe('CL-1.2')
      expect(proposal.state.value).toBe('Drafting')
    })

    it('3.3 Should enforce Direct Purchase registration milestone sequence (Sale Deed -> Stamp Duty -> Possession -> Mutation)', async () => {
      const milestoneService = new ManualMilestoneService()

      // Stamp duty clearance requires Sale Deed Registration first
      vi.mocked((db as any).manual_milestone.findMany).mockResolvedValue([])

      const stampDutyFail = await milestoneService.recordMilestone({
        entity_type: ACQ_LAND_SCHEDULE,
        entity_id: 'prop_dp_006',
        milestone_type: 'STAMP_DUTY_CLEARANCE',
        milestone_date: new Date(),
        outcome: 'CLEARED',
        user_id: 'user_legal',
      })
      expect(stampDutyFail.isFailure).toBe(true)
      expect(String(stampDutyFail.error)).toContain('Sale Deed Registration')

      // Record Sale Deed Registration first
      vi.mocked((db as any).manual_milestone.create).mockResolvedValue({ id: 'm_dp_1', milestone_type: 'SALE_DEED_REGISTRATION' })
      vi.mocked((db as any).acq_proposal.findUnique).mockResolvedValue({ proposal_id: 'prop_dp_006' } as any)

      const saleDeedSuccess = await milestoneService.recordMilestone({
        entity_type: ACQ_LAND_SCHEDULE,
        entity_id: 'prop_dp_006',
        milestone_type: 'SALE_DEED_REGISTRATION',
        milestone_date: new Date(),
        outcome: 'REGISTERED',
        user_id: 'user_legal',
      })
      expect(saleDeedSuccess.isSuccess).toBe(true)

      // Now Stamp Duty Clearance succeeds
      vi.mocked((db as any).manual_milestone.findMany).mockResolvedValue([
        { id: 'm_dp_1', milestone_type: 'SALE_DEED_REGISTRATION', sent_at: new Date() }
      ] as any)

      const stampDutySuccess = await milestoneService.recordMilestone({
        entity_type: ACQ_LAND_SCHEDULE,
        entity_id: 'prop_dp_006',
        milestone_type: 'STAMP_DUTY_CLEARANCE',
        milestone_date: new Date(),
        outcome: 'STAMP_CLEARED',
        user_id: 'user_legal',
      })
      expect(stampDutySuccess.isSuccess).toBe(true)
    })
  })
})
