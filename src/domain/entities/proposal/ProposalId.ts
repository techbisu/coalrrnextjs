import { ValueObject } from '@/core/base/ValueObject'
import { Result, Fail } from '@/core/result/Result'
import { ValidationException } from '@/core/errors'


export class ProposalId extends ValueObject<string> {
  private constructor(value: string) {
    super(value)
  }

  static create(value?: string): ProposalId {
    return new ProposalId(value ?? crypto.randomUUID())
  }

  static tryCreate(value: string): Result<ProposalId> {
    if (!value || typeof value !== 'string') {
      return Fail('Invalid Proposal ID')
    }
    return { isSuccess: true, isFailure: false, value: new ProposalId(value), error: null }
  }

  static fromString(value: string): ProposalId {
    return new ProposalId(value)
  }

  get value(): string { return this._value }
  toString(): string { return this.value.toString() }
}
