/**
 * Project Entity Tests - Domain layer unit tests.
 * Tests business logic and invariants.
 */
// @ts-nocheck
import { describe, it, expect } from 'vitest'
import { Project, ProjectAlreadyLockedException } from '@/domain/entities/project/Project'
import { ValidationException } from '@/core/errors'

describe('Project Entity', () => {
  describe('create', () => {
    it('should create a valid project', () => {
      const result = Project.create({
        name: 'Test Colliery Project',
        mine_cd: 'TCL001',
        total_land_limit_acres: 1000,
        total_budget_ceiling: 5000000,
        total_employment_quota: 100,
      })

      expect(result.isSuccess).toBe(true)
      expect(result.value?.name).toBe('Test Colliery Project')
      expect(result.value?.mine_cd).toBe('TCL001')
      expect(result.value?.isLocked()).toBe(false)
    })

    it('should fail with empty name', () => {
      const result = Project.create({
        name: '',
        mine_cd: 'TCL001',
        total_land_limit_acres: 1000,
        total_budget_ceiling: 5000000,
        total_employment_quota: 100,
      })

      expect(result.isFailure).toBe(true)
      expect(typeof result.error).toBe('string')
      expect(result.error).toContain('Project name is required')
    })

    it('should fail with negative land limit', () => {
      const result = Project.create({
        name: 'Test Project',
        mine_cd: 'TCL001',
        total_land_limit_acres: -100,
        total_budget_ceiling: 5000000,
        total_employment_quota: 100,
      })

      expect(result.isFailure).toBe(true)
    })

    it('should fail with negative budget', () => {
      const result = Project.create({
        name: 'Test Project',
        mine_cd: 'TCL001',
        total_land_limit_acres: 1000,
        total_budget_ceiling: -5000000,
        total_employment_quota: 100,
      })

      expect(result.isFailure).toBe(true)
    })

    it('should fail with multiple validation errors', () => {
      const result = Project.create({
        name: '',
        mine_cd: '',
        total_land_limit_acres: -100,
        total_budget_ceiling: -5000000,
        total_employment_quota: -10,
      })

      expect(result.isFailure).toBe(true)
      expect(typeof result.error).toBe('string')
      expect(result.error).toContain('Validation')
    })
  })

  describe('lock', () => {
    it('should lock an unlocked project', () => {
      const projectResult = Project.create({
        name: 'Test Project',
        mine_cd: 'TCL001',
        total_land_limit_acres: 1000,
        total_budget_ceiling: 5000000,
        total_employment_quota: 100,
      })

      const project = projectResult.value!
      const lockResult = project.lock('user-123')

      expect(lockResult.isSuccess).toBe(true)
      expect(project.isLocked()).toBe(true)
      expect(project.locked_at).not.toBeNull()
      expect(project.lockedBy).toBe('user-123')
    })

    it('should fail to lock an already locked project', () => {
      const projectResult = Project.create({
        name: 'Test Project',
        mine_cd: 'TCL001',
        total_land_limit_acres: 1000,
        total_budget_ceiling: 5000000,
        total_employment_quota: 100,
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
        mine_cd: 'TCL001',
        total_land_limit_acres: 1000,
        total_budget_ceiling: 5000000,
        total_employment_quota: 100,
      })

      const project = projectResult.value!
      project.lock('user-123')
      
      const events = project.getDomainEvents()
      expect(events.length).toBe(1)
      expect(events[0].event_type).toBe('PROJECT_LOCKED')
      expect(events[0].payload.lockedBy).toBe('user-123')
    })
  })

  describe('update', () => {
    it('should update unlocked project', () => {
      const projectResult = Project.create({
        name: 'Test Project',
        mine_cd: 'TCL001',
        total_land_limit_acres: 1000,
        total_budget_ceiling: 5000000,
        total_employment_quota: 100,
      })

      const project = projectResult.value!
      const updateResult = project.update(
        {
          name: 'Updated Project Name',
          total_budget_ceiling: 6000000,
        },
        'user-123'
      )

      expect(updateResult.isSuccess).toBe(true)
      expect(project.name).toBe('Updated Project Name')
      expect(project.total_budget_ceiling.toNumber()).toBe(6000000)
    })

    it('should fail to update locked project', () => {
      const projectResult = Project.create({
        name: 'Test Project',
        mine_cd: 'TCL001',
        total_land_limit_acres: 1000,
        total_budget_ceiling: 5000000,
        total_employment_quota: 100,
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
        mine_cd: 'TCL001',
        total_land_limit_acres: 1000,
        total_budget_ceiling: 5000000,
        total_employment_quota: 100,
      })

      const project = projectResult.value!
      expect(project.canBeEdited()).toBe(true)
      
      project.lock('user-123')
      expect(project.canBeEdited()).toBe(false)
    })
  })
})
