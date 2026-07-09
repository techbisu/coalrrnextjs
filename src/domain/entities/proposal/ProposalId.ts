/**
 * ProposalId Value Object - Unique identifier for Proposal aggregates.
 */
import { ValueObject } from '@/core/base/ValueObject'
import { Result, Fail } from '@/core/result/Result'
import { ValidationException } from '@/core/errors'

export class ProposalId extends ValueObject<string> {
  private constructor(value: string) {
    super(value)
  }

  static create(value?: string): ProposalId {
    return new ProposalId(value ?? generateProposalId())
  }

  static tryCreate(value: string): Result<ProposalId, ValidationException> {
    if (!value || value.trim().length === 0) {
      return Fail(new ValidationException('Invalid Proposal ID', [
        { field: 'id', message: 'Proposal ID cannot be empty' }
      ]))
    }
    return { isSuccess: true, isFailure: false, value: new ProposalId(value), error: null }
  }

  static fromString(value: string): ProposalId {
    return new ProposalId(value)
  }

  get value(): string {
    return this._value
  }
}

function generateProposalId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 10)
  return `prop_${timestamp}${random}`
}
