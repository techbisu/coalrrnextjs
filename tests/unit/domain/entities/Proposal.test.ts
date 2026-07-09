/**
 * Proposal Entity Tests - Domain layer unit tests.
 */
import { describe, it, expect } from 'vitest'
import { Proposal, ProposalNotEditableException, ProposalNotSubmittableException, ChecklistItemNotFoundException } from '@/domain/entities/proposal/Proposal'
import { ValidationException } from '@/core/errors'
import { Area } from '@/domain/value-objects/Area'

describe('Proposal Entity', () => {
  describe('create', () => {
    it('should create a valid proposal', () => {
      const result = Proposal.create({
        projectId: 'proj_123',
        proposalTitle: 'Test Acquisition Proposal',
        acquisitionMode: 'rfctlarr',
        proposedBy: 'John Doe',
        proposedByRole: 'area_office',
        collieryCode: 'TCL001',
      })

      expect(result.isSuccess).toBe(true)
      const proposal = result.value!
      
      expect(proposal.projectId).toBe('proj_123')
      expect(proposal.proposalTitle).toBe('Test Acquisition Proposal')
      expect(proposal.acquisitionMode.value).toBe('rfctlarr')
      expect(proposal.state.value).toBe('Drafting')
      expect(proposal.totalArea.toNumber()).toBe(0)
      expect(proposal.plotIds).toHaveLength(0)
      
      // Should initialize mode-specific checklist
      expect(proposal.checklist.checklistCode).toBe('CL-1.3')
      expect(proposal.checklist.getAllItems().length).toBeGreaterThan(0)
    })

    it('should fail with empty title', () => {
      const result = Proposal.create({
        projectId: 'proj_123',
        proposalTitle: '',
        acquisitionMode: 'rfctlarr',
        proposedBy: 'John Doe',
        proposedByRole: 'area_office',
        collieryCode: 'TCL001',
      })

      expect(result.isFailure).toBe(true)
      expect(result.error).toBeInstanceOf(ValidationException)
    })

    it('should fail with invalid acquisition mode', () => {
      const result = Proposal.create({
        projectId: 'proj_123',
        proposalTitle: 'Test',
        acquisitionMode: 'invalid_mode',
        proposedBy: 'John Doe',
        proposedByRole: 'area_office',
        collieryCode: 'TCL001',
      })

      expect(result.isFailure).toBe(true)
      expect(result.error).toBeInstanceOf(ValidationException)
    })
  })

  describe('plot management', () => {
    it('should add a plot and update total area', () => {
      const proposal = Proposal.create({
        projectId: 'proj_123',
        proposalTitle: 'Test',
        acquisitionMode: 'rfctlarr',
        proposedBy: 'John',
        proposedByRole: 'role',
        collieryCode: 'TCL001',
      }).value!

      const area = Area.fromAcres(2.5)
      const result = proposal.addPlot('plot_1', area)

      expect(result.isSuccess).toBe(true)
      expect(proposal.hasPlot('plot_1')).toBe(true)
      expect(proposal.getPlotCount()).toBe(1)
      expect(proposal.totalArea.toNumber()).toBe(2.5)
    })

    it('should remove a plot and update total area', () => {
      const proposal = Proposal.create({
        projectId: 'proj_123',
        proposalTitle: 'Test',
        acquisitionMode: 'rfctlarr',
        proposedBy: 'John',
        proposedByRole: 'role',
        collieryCode: 'TCL001',
      }).value!

      const area = Area.fromAcres(2.5)
      proposal.addPlot('plot_1', area)
      
      const result = proposal.removePlot('plot_1', area)

      expect(result.isSuccess).toBe(true)
      expect(proposal.hasPlot('plot_1')).toBe(false)
      expect(proposal.getPlotCount()).toBe(0)
      expect(proposal.totalArea.toNumber()).toBe(0)
    })
  })

  describe('checklist management', () => {
    it('should update checklist item status', () => {
      const proposal = Proposal.create({
        projectId: 'proj_123',
        proposalTitle: 'Test',
        acquisitionMode: 'rfctlarr',
        proposedBy: 'John',
        proposedByRole: 'role',
        collieryCode: 'TCL001',
      }).value!

      // Get a required item key
      const requiredItems = proposal.checklist.getRequiredItems()
      const firstItem = requiredItems[0]

      const result = proposal.updateChecklistItem(firstItem.key, 'complete')

      expect(result.isSuccess).toBe(true)
      
      const updatedItem = proposal.checklist.getItem(firstItem.key)
      expect(updatedItem?.status).toBe('complete')
    })

    it('should fail to update non-existent checklist item', () => {
      const proposal = Proposal.create({
        projectId: 'proj_123',
        proposalTitle: 'Test',
        acquisitionMode: 'rfctlarr',
        proposedBy: 'John',
        proposedByRole: 'role',
        collieryCode: 'TCL001',
      }).value!

      const result = proposal.updateChecklistItem('non_existent_key', 'complete')

      expect(result.isFailure).toBe(true)
      expect(result.error).toBeInstanceOf(ChecklistItemNotFoundException)
    })
  })

  describe('submission workflow', () => {
    it('should fail submission if required checklist items are incomplete', () => {
      const proposal = Proposal.create({
        projectId: 'proj_123',
        proposalTitle: 'Test',
        acquisitionMode: 'rfctlarr',
        proposedBy: 'John',
        proposedByRole: 'role',
        collieryCode: 'TCL001',
      }).value!

      const submitResult = proposal.submit()

      expect(submitResult.isFailure).toBe(true)
      expect(submitResult.error).toBeInstanceOf(ProposalNotSubmittableException)
      expect(proposal.state.value).toBe('Drafting')
    })

    it('should allow submission when all required checklist items are complete', () => {
      const proposal = Proposal.create({
        projectId: 'proj_123',
        proposalTitle: 'Test',
        acquisitionMode: 'rfctlarr',
        proposedBy: 'John',
        proposedByRole: 'role',
        collieryCode: 'TCL001',
      }).value!

      // Complete all required items
      const requiredItems = proposal.checklist.getRequiredItems()
      requiredItems.forEach(item => {
        proposal.updateChecklistItem(item.key, 'complete')
      })

      const submitResult = proposal.submit()

      expect(submitResult.isSuccess).toBe(true)
      expect(proposal.state.value).toBe('AreaVetting')
    })

    it('should prevent editing after submission', () => {
      const proposal = Proposal.create({
        projectId: 'proj_123',
        proposalTitle: 'Test',
        acquisitionMode: 'rfctlarr',
        proposedBy: 'John',
        proposedByRole: 'role',
        collieryCode: 'TCL001',
      }).value!

      // Setup and submit
      proposal.checklist.getRequiredItems().forEach(item => {
        proposal.updateChecklistItem(item.key, 'complete')
      })
      proposal.submit()

      // Try to edit
      const editResult = proposal.update({ proposalTitle: 'New Title' })

      expect(editResult.isFailure).toBe(true)
      expect(editResult.error).toBeInstanceOf(ProposalNotEditableException)
    })
  })
})
