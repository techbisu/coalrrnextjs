/**
 * Money Value Object - Represents monetary values with currency.
 * Never use floating-point for money - always use Decimal or integer cents.
 */
import { ValueObject } from '@/core/base/ValueObject'
import { Result, Fail } from '@/core/result/Result'
import { ValidationException } from '@/core/errors'
import Decimal from 'decimal.js'

export interface MoneyProps {
  amount: Decimal
  currency: string
}

export class Money extends ValueObject<MoneyProps> {
  private constructor(props: MoneyProps) {
    super(props)
  }

  // Factory methods
  static fromINR(amount: number | string): Money {
    return new Money({
      amount: new Decimal(amount),
      currency: 'INR',
    })
  }

  static fromDecimal(amount: Decimal, currency: string = 'INR'): Money {
    return new Money({ amount, currency })
  }

  static zero(currency: string = 'INR'): Money {
    return new Money({ amount: new Decimal(0), currency })
  }

  static tryCreate(amount: number | string, currency: string = 'INR'): Result<Money, ValidationException> {
    try {
      const decimal = new Decimal(amount)
      if (decimal.isNaN()) {
        return Fail(new ValidationException('Invalid monetary value', [
          { field: 'amount', message: 'Must be a valid number' }
        ]))
      }
      return { isSuccess: true, isFailure: false, value: new Money({ amount: decimal, currency }), error: null }
    } catch (e) {
      return Fail(new ValidationException('Invalid monetary value', [
        { field: 'amount', message: 'Must be a valid number' }
      ]))
    }
  }

  // Getters
  get amount(): Decimal {
    return this._value.amount
  }

  get currency(): string {
    return this._value.currency
  }

  // Operations (always return new instances - immutability)
  add(other: Money): Money {
    this.ensureSameCurrency(other)
    return new Money({
      amount: this._value.amount.plus(other._value.amount),
      currency: this._value.currency,
    })
  }

  subtract(other: Money): Money {
    this.ensureSameCurrency(other)
    return new Money({
      amount: this._value.amount.minus(other._value.amount),
      currency: this._value.currency,
    })
  }

  multiply(factor: number | Decimal): Money {
    return new Money({
      amount: this._value.amount.times(factor),
      currency: this._value.currency,
    })
  }

  divide(factor: number | Decimal): Money {
    return new Money({
      amount: this._value.amount.dividedBy(factor),
      currency: this._value.currency,
    })
  }

  percentage(percent: number): Money {
    return this.multiply(percent).divide(100)
  }

  // Comparisons
  isGreaterThan(other: Money): boolean {
    this.ensureSameCurrency(other)
    return this._value.amount.greaterThan(other._value.amount)
  }

  isLessThan(other: Money): boolean {
    this.ensureSameCurrency(other)
    return this._value.amount.lessThan(other._value.amount)
  }

  isGreaterThanOrEqual(other: Money): boolean {
    this.ensureSameCurrency(other)
    return this._value.amount.greaterThanOrEqualTo(other._value.amount)
  }

  isZero(): boolean {
    return this._value.amount.isZero()
  }

  isPositive(): boolean {
    return this._value.amount.isPositive()
  }

  isNegative(): boolean {
    return this._value.amount.isNegative()
  }

  // Utility
  toNumber(): number {
    return this._value.amount.toNumber()
  }

  toString(): string {
    return `${this._value.currency} ${this._value.amount.toFixed(2)}`
  }

  toDecimal(): Decimal {
    return this._value.amount
  }

  toJSON(): string {
    return this._value.amount.toString()
  }

  format(): string {
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: this._value.currency,
      minimumFractionDigits: 2,
    }).format(this._value.amount.toNumber())
    return formatted
  }

  private ensureSameCurrency(other: Money): void {
    if (this._value.currency !== other._value.currency) {
      throw new ValidationException(
        `Cannot operate on different currencies: ${this._value.currency} and ${other._value.currency}`,
        [{ field: 'currency', message: 'Currencies must match' }]
      )
    }
  }
}
