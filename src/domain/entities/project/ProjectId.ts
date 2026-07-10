import { ValueObject } from '@/core/base/ValueObject'
import { Result, Fail } from '@/core/result/Result'
import { ValidationException } from '@/core/errors'


export class ProjectId extends ValueObject<string> {
  private constructor(value: string) {
    super(value)
  }

  static create(value?: string): ProjectId {
    return new ProjectId(value ?? crypto.randomUUID())
  }

  static tryCreate(value: string): Result<ProjectId> {
    if (!value || typeof value !== 'string') {
      return Fail('Invalid Project ID')
    }
    return { isSuccess: true, isFailure: false, value: new ProjectId(value), error: null }
  }

  static fromString(value: string): ProjectId {
    return new ProjectId(value)
  }

  get value(): string { return this._value }
  toString(): string { return this.value.toString() }
}
