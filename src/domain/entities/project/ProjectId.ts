/**
 * ProjectId Value Object - Unique identifier for Project aggregates.
 */
import { ValueObject } from '@/core/base/ValueObject'
import { Result, Fail } from '@/core/result/Result'
import { ValidationException } from '@/core/errors'

export class ProjectId extends ValueObject<string> {

  private constructor(value: string) {
    super(value)
  }
  static create(value?: string): ProjectId {return new ProjectId(value ?? generateCuid())
  }
  static tryCreate(value: string): Result<ProjectId, ValidationException> {
    if (!value || value.trim().length === 0) {
      return Fail(new ValidationException('Invalid Project ID', [
        { field: 'id', message: 'Project ID cannot be empty' }
      ]))
    }
    return { isSuccess: true, isFailure: false, value: new ProjectId(value), error: null }
  }

  static fromString(value: string): ProjectId {
    return new ProjectId(value)
  }

  get value(): string { return this._value }
}

// Simple CUID generator for IDs
function generateCuid(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 10)
  return `prj_${timestamp}${random}`
}