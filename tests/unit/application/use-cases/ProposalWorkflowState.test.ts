import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Proposal } from '@/domain/entities/proposal/Proposal'
import { ACQ_LAND_SCHEDULE, MODULE_CODES, CHECKABLE_ENTITY_TYPES } from '@/core/config/module-codes.config'
import { SubmitProposalUseCase } from '@/application/use-cases/proposal/SubmitProposalUseCase'
import { Result } from '@/core'

// Mock EventBus and AuditQueue
vi.mock('@/core/notifications/EventBus', () => ({
  EventBus: {
    publish: vi.fn(),
  }
}))
vi.mock('@/infrastructure/di/modules/core.di', () => ({
  auditQueue: {
    push: vi.fn(),
  }
}))

// Mock dependencies
const mockProposalRepo = {
  findById: vi.fn(),
  save: vi.fn(),
  isPlotInActiveProposal: vi.fn(),
  addPlotToProposal: vi.fn(),
  removePlotFromProposal: vi.fn(),
}

const mockProjectRepo = {
  findById: vi.fn(),
  findAll: vi.fn(),
  findByName: vi.fn(),
  findByMineCode: vi.fn(),
  generateEclProjCd: vi.fn(),
  save: vi.fn(),
  delete: vi.fn(),
  exists: vi.fn(),
  lock: vi.fn(),
  updateProjectLocations: vi.fn(),
  syncProjectDocuments: vi.fn(),
  approveFormXXII: vi.fn(),
}

const mockProjectLimitService = {
  checkProposalLimits: vi.fn(),
}

const mockChecklistUseCase = {
  execute: vi.fn(),
}

describe('Proposal Module Workflow State & Canonical Constants Suite', () => {

  describe('Canonical Entity & Module Code Constants', () => {
    it('should export canonical module codes and checkable entity types', () => {
      expect(MODULE_CODES.LAND_SCHEDULE).toBe('LAND_SCHEDULE')
      expect(CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE).toBe('acq_land_schedule')
      expect(ACQ_LAND_SCHEDULE).toBe('acq_land_schedule')
    })
  })

  describe('Mode-Specific Proposal Creation & Checklist Resolution', () => {
    it('should create Mode 1 (CBA Act) proposal with CL-1.1 checklist', () => {
      const propResult = Proposal.create({
        projectId: 'proj_cba_01',
        proposalTitle: 'CBA Expansion Project Phase I',
        acq_mode_id: 1,
        proposedBy: 'Officer A',
        proposedByRole: 'unit_office',
        collieryCode: 'MINE_001',
      })

      expect(propResult.isSuccess).toBe(true)
      const proposal = propResult.value!
      expect(proposal.acq_mode_id).toBe(1)
      expect(proposal.checklist.checklistCode).toBe('CL-1.1')
      expect(proposal.state.value).toBe('Drafting')
    })

    it('should create Mode 2 (RFCTLARR) proposal with CL-1.3 checklist', () => {
      const propResult = Proposal.create({
        projectId: 'proj_rfctlarr_01',
        proposalTitle: 'RFCTLARR Land Procurement',
        acq_mode_id: 2,
        proposedBy: 'Officer B',
        proposedByRole: 'area_office',
        collieryCode: 'MINE_002',
      })

      expect(propResult.isSuccess).toBe(true)
      const proposal = propResult.value!
      expect(proposal.acq_mode_id).toBe(2)
      expect(proposal.checklist.checklistCode).toBe('CL-1.3')
      expect(proposal.state.value).toBe('Drafting')
    })

    it('should create Mode 6 (Direct Purchase) proposal with CL-1.2 checklist', () => {
      const propResult = Proposal.create({
        projectId: 'proj_dp_01',
        proposalTitle: 'Direct Purchase Tenancy Block',
        acq_mode_id: 6,
        proposedBy: 'Officer C',
        proposedByRole: 'unit_office',
        collieryCode: 'MINE_003',
      })

      expect(propResult.isSuccess).toBe(true)
      const proposal = propResult.value!
      expect(proposal.acq_mode_id).toBe(6)
      expect(proposal.checklist.checklistCode).toBe('CL-1.2')
      expect(proposal.state.value).toBe('Drafting')
    })
  })

  describe('SubmitProposalUseCase Gating Logic', () => {
    let submitUseCase: SubmitProposalUseCase

    beforeEach(() => {
      vi.clearAllMocks()
      submitUseCase = new SubmitProposalUseCase(
        mockProposalRepo as any,
        mockProjectRepo as any,
        mockProjectLimitService as any,
        mockChecklistUseCase as any
      )
    })

    it('should reject submission if mandatory checklist items are incomplete', async () => {
      const proposal = Proposal.create({
        projectId: 'proj_001',
        proposalTitle: 'Sample Proposal',
        acq_mode_id: 6,
        proposedBy: 'Officer',
        proposedByRole: 'unit_office',
        collieryCode: 'M001',
      }).value!

      mockProposalRepo.findById.mockResolvedValue(proposal)
      mockProjectRepo.findById.mockResolvedValue({ id: 'proj_001' })
      mockProjectLimitService.checkProposalLimits.mockResolvedValue(
        Result.ok({ isLimitBreached: false, breachReasons: [] })
      )
      // Mock checklist as INCOMPLETE
      mockChecklistUseCase.execute.mockResolvedValue(
        Result.ok({ isComplete: false, missingItems: ['PROP_CL_001'] })
      )

      const result = await submitUseCase.execute({
        proposalId: 'prop_001',
        user_id: 'user_123',
      })

      expect(result.isFailure).toBe(true)
      expect(String(result.error)).toContain('mandatory checklist items must be completed')
      expect(mockChecklistUseCase.execute).toHaveBeenCalledWith({
        moduleCode: MODULE_CODES.LAND_SCHEDULE,
        checkableType: ACQ_LAND_SCHEDULE,
        checkableId: 'prop_001',
      })
    })

    it('should succeed and advance state when checklist is 100% complete', async () => {
      const proposal = Proposal.create({
        projectId: 'proj_001',
        proposalTitle: 'Sample Proposal',
        acq_mode_id: 6,
        proposedBy: 'Officer',
        proposedByRole: 'unit_office',
        collieryCode: 'M001',
      }).value!

      // Complete in-memory domain entity checklist items
      proposal.checklist.getAllItems().forEach((item) => {
        if (item.required) {
          proposal.updateChecklistItem(item.key, 'complete')
        }
      })

      mockProposalRepo.findById.mockResolvedValue(proposal)
      mockProjectRepo.findById.mockResolvedValue({ id: 'proj_001' })
      mockProjectLimitService.checkProposalLimits.mockResolvedValue(
        Result.ok({ isLimitBreached: false, breachReasons: [] })
      )
      // Mock checklist UseCase as COMPLETE
      mockChecklistUseCase.execute.mockResolvedValue(
        Result.ok({ isComplete: true, missingItems: [] })
      )

      const result = await submitUseCase.execute({
        proposalId: 'prop_001',
        user_id: 'user_123',
      })

      expect(result.isSuccess).toBe(true)
      expect(proposal.state.value).toBe('AreaVetting')
      expect(mockProposalRepo.save).toHaveBeenCalledWith(proposal)
    })
  })
})
