/**
 * ScheduleCode Value Object - Unique schedule code for proposals.
 * Format: SCH-YYYY-NNN (e.g., SCH-2026-001)
 */
import { ValueObject } from '@/core/base/ValueObject'
import { Result, Fail } from '@/core/result/Result'
import { ValidationException } from '@/core/errors'

export class ScheduleCode extends ValueObject<string> {
  private static readonly CODE_PATTERN = /^SCH-\d{4}-\d{3}$/

  private constructor(value: string) {
    super(value)
  }

  static generate(): ScheduleCode {
    const year = new Date().getFullYear()
    const random = Math.floor(1 + Math.random() * 999)
    const code = `SCH-${year}-${String(random).padStart(3, '0')}`
    return new ScheduleCode(code)
  }

  static tryCreate(value: string): Result<ScheduleCode> {
    if (!value || value.trim().length === 0) {
      return Fail('Invalid Schedule Code')
    }

    if (!this.CODE_PATTERN.test(value)) {
      return Fail('Invalid Schedule Code')
    }

    return { isSuccess: true, isFailure: false, value: new ScheduleCode(value), error: null }
  }

  static fromString(value: string): ScheduleCode {
    return new ScheduleCode(value)
  }

  get value(): string {
    return this._value
  }

  getYear(): number {
    const match = this._value.match(/SCH-(\d{4})-\d{3}/)
    return match ? parseInt(match[1], 10) : 0
  }

  getSequence(): number {
    const match = this._value.match(/SCH-\d{4}-(\d{3})/)
    return match ? parseInt(match[1], 10) : 0
  }
}
