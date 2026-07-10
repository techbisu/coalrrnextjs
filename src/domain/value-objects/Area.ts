/**
 * Area Value Object - Represents land area measurements.
 * Used for land acquisition, plot sizes, and employment quotas.
 */
import { ValueObject } from '@/core/base/ValueObject'
import { Result, Fail } from '@/core/result/Result'
import { ValidationException } from '@/core/errors'
import Decimal from 'decimal.js'

export type AreaUnit = 'ACRES' | 'HECTARES' | 'SQFT' | 'SQM'

export interface AreaProps {
  value: Decimal
  unit: AreaUnit
}

export class Area extends ValueObject<AreaProps> {
  private constructor(props: AreaProps) {
    super(props)
  }

  // Factory methods
  static fromAcres(value: number | string): Area {
    return new Area({ value: new Decimal(value), unit: 'ACRES' })
  }

  static fromHectares(value: number | string): Area {
    return new Area({ value: new Decimal(value), unit: 'HECTARES' })
  }

  static fromSqFt(value: number | string): Area {
    return new Area({ value: new Decimal(value), unit: 'SQFT' })
  }

  static zero(unit: AreaUnit = 'ACRES'): Area {
    return new Area({ value: new Decimal(0), unit })
  }

  static tryCreate(value: number | string, unit: AreaUnit = 'ACRES'): Result<Area> {
    try {
      const decimal = new Decimal(value)
      if (decimal.isNaN() || decimal.isNegative()) {
        return Fail('Invalid area value')
      }
      return { isSuccess: true, isFailure: false, value: new Area({ value: decimal, unit }), error: null }
    } catch (e) {
      return Fail('Invalid area value')
    }
  }

  // Getters
  get numericValue(): Decimal {
    return this._value.value
  }

  get unit(): AreaUnit {
    return this._value.unit
  }

  // Conversions
  toAcres(): Area {
    switch (this._value.unit) {
      case 'ACRES':
        return this
      case 'HECTARES':
        return new Area({ value: this._value.value.times(2.47105), unit: 'ACRES' })
      case 'SQFT':
        return new Area({ value: this._value.value.dividedBy(43560), unit: 'ACRES' })
      case 'SQM':
        return new Area({ value: this._value.value.dividedBy(4046.86), unit: 'ACRES' })
    }
  }

  toHectares(): Area {
    return this.toAcres()._value.unit === 'ACRES'
      ? new Area({ value: this.toAcres()._value.value.dividedBy(2.47105), unit: 'HECTARES' })
      : this
  }

  // Operations
  add(other: Area): Area {
    const otherInSameUnit = other.toUnit(this._value.unit)
    return new Area({
      value: this._value.value.plus(otherInSameUnit._value.value),
      unit: this._value.unit,
    })
  }

  subtract(other: Area): Area {
    const otherInSameUnit = other.toUnit(this._value.unit)
    return new Area({
      value: this._value.value.minus(otherInSameUnit._value.value),
      unit: this._value.unit,
    })
  }

  // Comparisons
  isGreaterThan(other: Area): boolean {
    const otherInSameUnit = other.toUnit(this._value.unit)
    return this._value.value.greaterThan(otherInSameUnit._value.value)
  }

  isLessThan(other: Area): boolean {
    const otherInSameUnit = other.toUnit(this._value.unit)
    return this._value.value.lessThan(otherInSameUnit._value.value)
  }

  isGreaterThanOrEqual(other: Area): boolean {
    const otherInSameUnit = other.toUnit(this._value.unit)
    return this._value.value.greaterThanOrEqualTo(otherInSameUnit._value.value)
  }

  isZero(): boolean {
    return this._value.value.isZero()
  }

  // Utility
  private toUnit(unit: AreaUnit): Area {
    if (this._value.unit === unit) return this
    switch (unit) {
      case 'ACRES':
        return this.toAcres()
      case 'HECTARES':
        return this.toHectares()
      default:
        return this.toAcres()
    }
  }

  toNumber(): number {
    return this._value.value.toNumber()
  }

  toString(): string {
    return `${this._value.value.toFixed(4)} ${this._value.unit}`
  }

  toDecimal(): Decimal {
    return this._value.value
  }

  toJSON(): string {
    return this._value.value.toString()
  }
}
