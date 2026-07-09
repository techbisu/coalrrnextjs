/**
 * Project Entity Tests - Domain layer unit tests.
 * Tests business logic and invariants.
 */
import { describe, it, expect } from 'vitest'
import { Project, ProjectAlreadyLockedException } from '@/domain/entities/project/Project'
import { ValidationException } from '@/core/errors'

describe('Project Entity', () => {
  describe('create', () => {
    it('should create a valid project', () => {
      const result = Project.create({
        name: 'Test Colliery Project',
        collieryCode: 'TCL001',
        totalLandLimitAcres: 1000,
        totalBudgetCeiling: 5000000,
        totalEmploymentQuota: 100,
      })

      expect(result.isSuccess).toBe(true)
      expect(result.value?.name).toBe('Test Colliery Project')
      expect(result.value?.collieryCode).toBe('TCL001')
      expect(result.value?.isLocked()).toBe(false)
    })

    it('should fail with empty name', () => {
      const result = Project.create({
        name: '',
        collieryCode: 'TCL001',
        totalLandLimitAcres: 1000,
        totalBudgetCeiling: 5000000,
        totalEmploymentQuota: 100,
      })

      expect(result.isFailure).toBe(true)
      expect(result.error).toBeInstanceOf(ValidationException)
      const error = result.error as ValidationException
      expect(error.errors).toContainEqual({
        field: 'name',
        message: 'Project name is required',
      })
    })

    it('should fail with negative land limit', () => {
      const result = Project.create({
        name: 'Test Project',
        collieryCode: 'TCL001',
        totalLandLimitAcres: -100,
        totalBudgetCeiling: 5000000,
        totalEmploymentQuota: 100,
      })

      expect(result.isFailure).toBe(true)
    })

    it('should fail with negative budget', () => {
      const result = Project.create({
        name: 'Test Project',
        collieryCode: 'TCL001',
        totalLandLimitAcres: 1000,
        totalBudgetCeiling: -5000000,
        totalEmploymentQuota: 100,
      })

      expect(result.isFailure).toBe(true)
    })

    it('should fail with multiple validation errors', () => {
      const result = Project.create({
        name: '',
        collieryCode: '',
        totalLandLimitAcres: -100,
        totalBudgetCeiling: -5000000,
        totalEmploymentQuota: -10,
      })

      expect(result.isFailure).toBe(true)
      const error = result.error as ValidationException
      expect(error.errors.length).toBeGreaterThan(1)
    })
  })

  describe('lock', () => {
    it('should lock an unlocked project', () => {
      const projectResult = Project.create({
        name: 'Test Project',
        collieryCode: 'TCL001',
        totalLandLimitAcres: 1000,
        totalBudgetCeiling: 5000000,
        totalEmploymentQuota: 100,
      })

      const project = projectResult.value!
      const lockResult = project.lock('user-123')

      expect(lockResult.isSuccess).toBe(true)
      expect(project.isLocked()).toBe(true)
      expect(project.lockedAt).not.toBeNull()
      expect(project.lockedBy).toBe('user-123')
    })

    it('should fail to lock an already locked project', () => {
      const projectResult = Project.create({
        name: 'Test Project',
        collieryCode: 'TCL001',
        totalLandLimitAcres: 1000,
        totalBudgetCeiling: 5000000,
        totalEmploymentQuota: 100,
      })

      const project = projectResult.value!
      project.lock('user-123')
      
      const secondLockResult = project.lock('user-456')

      expect(secondLockResult.isFailure).toBe(true)
      expect(secondLockResult.error).toBeInstanceOf(ProjectAlreadyLockedException)
    })

    it('should emit domain event when locked', () => {
      const projectResult = Project.create({
        name: 'Test Project',
        collieryCode: 'TCL001',
        totalLandLimitAcres: 1000,
        totalBudgetCeiling: 5000000,
        totalEmploymentQuota: 100,
      })

      const project = projectResult.value!
      project.lock('user-123')
      
      const events = project.getDomainEvents()
      expect(events.length).toBe(1)
      expect(events[0].eventType).toBe('PROJECT_LOCKED')
      expect(events[0].payload.lockedBy).toBe('user-123')
    })
  })

  describe('update', () => {
    it('should update unlocked project', () => {
      const projectResult = Project.create({
        name: 'Test Project',
        collieryCode: 'TCL001',
        totalLandLimitAcres: 1000,
        totalBudgetCeiling: 5000000,
        totalEmploymentQuota: 100,
      })

      const project = projectResult.value!
      const updateResult = project.update(
        {
          name: 'Updated Project Name',
          totalBudgetCeiling: 6000000,
        },
        'user-123'
      )

      expect(updateResult.isSuccess).toBe(true)
      expect(project.name).toBe('Updated Project Name')
      expect(project.totalBudgetCeiling.toNumber()).toBe(6000000)
    })

    it('should fail to update locked project', () => {
      const projectResult = Project.create({
        name: 'Test Project',
        collieryCode: 'TCL001',
        totalLandLimitAcres: 1000,
        totalBudgetCeiling: 5000000,
        totalEmploymentQuota: 100,
      })

      const project = projectResult.value!
      project.lock('user-123')
      
      const updateResult = project.update(
        { name: 'New Name' },
        'user-123'
      )

      expect(updateResult.isFailure).toBe(true)
      expect(updateResult.error).toBeInstanceOf(ProjectAlreadyLockedException)
    })
  })

  describe('business rules', () => {
    it('should correctly identify if project can be edited', () => {
      const projectResult = Project.create({
        name: 'Test Project',
        collieryCode: 'TCL001',
        totalLandLimitAcres: 1000,
        totalBudgetCeiling: 5000000,
        totalEmploymentQuota: 100,
      })

      const project = projectResult.value!
      expect(project.canBeEdited()).toBe(true)
      
      project.lock('user-123')
      expect(project.canBeEdited()).toBe(false)
    })
  })
})
