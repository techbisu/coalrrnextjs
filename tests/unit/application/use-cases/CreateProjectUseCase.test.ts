/**
 * Create Project Use Case Tests - Application layer unit tests.
 * Tests orchestration logic and integration between layers.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CreateProjectUseCase } from '@/application/use-cases/project/CreateProjectUseCase'
import { IProjectRepository } from '@/domain'
import { ValidationException } from '@/core/errors'

// Mock repository
class MockProjectRepository implements IProjectRepository {
  findById = vi.fn()
  findAll = vi.fn()
  findByName = vi.fn()
  findByCollieryCode = vi.fn()
  save = vi.fn()
  delete = vi.fn()
  exists = vi.fn()
  lock = vi.fn()
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
      collieryCode: 'TCL001',
      totalLandLimitAcres: 1000,
      totalBudgetCeiling: 5000000,
      totalEmploymentQuota: 100,
      userId: 'user-123',
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
      collieryCode: 'TCL001',
      totalLandLimitAcres: -100, // Invalid
      totalBudgetCeiling: 5000000,
      totalEmploymentQuota: 100,
      userId: 'user-123',
    }

    const result = await useCase.execute(request)

    expect(result.isFailure).toBe(true)
    expect(result.error).toBeInstanceOf(ValidationException)
    expect(mockRepository.save).not.toHaveBeenCalled()
  })

  it('should persist the project through repository', async () => {
    const request = {
      name: 'Test Project',
      collieryCode: 'TCL001',
      totalLandLimitAcres: 1000,
      totalBudgetCeiling: 5000000,
      totalEmploymentQuota: 100,
      userId: 'user-123',
    }

    await useCase.execute(request)

    expect(mockRepository.save).toHaveBeenCalledTimes(1)
    const savedProject = mockRepository.save.mock.calls[0][0]
    expect(savedProject.name).toBe('Test Project')
    expect(savedProject.collieryCode).toBe('TCL001')
  })

  it('should handle repository errors', async () => {
    mockRepository.save.mockRejectedValue(new Error('Database error'))

    const request = {
      name: 'Test Project',
      collieryCode: 'TCL001',
      totalLandLimitAcres: 1000,
      totalBudgetCeiling: 5000000,
      totalEmploymentQuota: 100,
      userId: 'user-123',
    }

    await expect(useCase.execute(request)).rejects.toThrow('Database error')
  })
})
