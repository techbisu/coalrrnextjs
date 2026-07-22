/**
 * Create Project Use Case Tests - Application layer unit tests.
 * Tests orchestration logic and integration between layers.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CreateProjectUseCase } from '@/application/use-cases/project/CreateProjectUseCase'
import { IProjectRepository } from '@/domain'
import { ValidationException } from '@/core/errors'

// Mock EventBus and AuditQueue
vi.mock('@/core/notifications/EventBus', () => ({
  EventBus: {
    publish: vi.fn(),
  }
}))
vi.mock('@/core/audit/services/AuditQueue', () => ({
  AuditQueue: {
    push: vi.fn(),
  }
}))

// Mock repository
class MockProjectRepository implements IProjectRepository {
  findById = vi.fn()
  findAll = vi.fn()
  findByName = vi.fn()
  findByMineCode = vi.fn()
  generateEclProjCd = vi.fn().mockResolvedValue('ECL/TEST/001')
  save = vi.fn()
  delete = vi.fn()
  exists = vi.fn()
  lock = vi.fn()
  updateProjectMouzas = vi.fn()
  syncProjectDocuments = vi.fn()
}

describe('CreateProjectUseCase', () => {
  let useCase: CreateProjectUseCase
  let mockRepository: MockProjectRepository

  beforeEach(() => {
    mockRepository = new MockProjectRepository()
    useCase = new CreateProjectUseCase(mockRepository)
  })

  it('should create a valid project', async () => {
    const request = {
      name: 'Test Colliery Project',
      mine_cd: 'TCL001',
      total_land_limit_acres: 1000,
      total_budget_ceiling: 5000000,
      total_employment_quota: 100,
      user_id: 'user-123',
    }

    const result = await useCase.execute(request)

    expect(result.isSuccess).toBe(true)
    expect(result.value?.name).toBe('Test Colliery Project')
    expect(result.value?.message).toContain('created successfully')
    expect(mockRepository.save).toHaveBeenCalledTimes(1)
  })

  it('should fail with validation errors', async () => {
    const request = {
      name: '', // Invalid
      mine_cd: 'TCL001',
      total_land_limit_acres: -100, // Invalid
      total_budget_ceiling: 5000000,
      total_employment_quota: 100,
      user_id: 'user-123',
    }

    const result = await useCase.execute(request)

    expect(result.isFailure).toBe(true)
    expect(result.error).toBeInstanceOf(ValidationException)
    expect(mockRepository.save).not.toHaveBeenCalled()
  })

  it('should persist the project through repository', async () => {
    const request = {
      name: 'Test Project',
      mine_cd: 'TCL001',
      total_land_limit_acres: 1000,
      total_budget_ceiling: 5000000,
      total_employment_quota: 100,
      user_id: 'user-123',
    }

    await useCase.execute(request)

    expect(mockRepository.save).toHaveBeenCalledTimes(1)
    const savedProject = mockRepository.save.mock.calls[0][0]
    expect(savedProject.name).toBe('Test Project')
    expect(savedProject.mine_cd).toBe('TCL001')
  })

  it('should handle repository errors', async () => {
    mockRepository.save.mockRejectedValue(new Error('Database error'))

    const request = {
      name: 'Test Project',
      mine_cd: 'TCL001',
      total_land_limit_acres: 1000,
      total_budget_ceiling: 5000000,
      total_employment_quota: 100,
      user_id: 'user-123',
    }

    await expect(useCase.execute(request)).rejects.toThrow('Database error')
  })
})
