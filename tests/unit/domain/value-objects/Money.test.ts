/**
 * Money Value Object Tests - Tests monetary calculations and immutability.
 */
import { describe, it, expect } from 'vitest'
import { Money } from '@/domain/value-objects/Money'
import { ValidationException } from '@/core/errors'
import Decimal from 'decimal.js'

describe('Money Value Object', () => {
  describe('creation', () => {
    it('should create money from INR', () => {
      const money = Money.fromINR(1000)
      expect(money.toNumber()).toBe(1000)
      expect(money.currency).toBe('INR')
    })

    it('should create money from string', () => {
      const money = Money.fromINR('2500.50')
      expect(money.toNumber()).toBe(2500.50)
    })

    it('should create zero money', () => {
      const money = Money.zero()
      expect(money.isZero()).toBe(true)
      expect(money.toNumber()).toBe(0)
    })

    it('should handle tryCreate with valid input', () => {
      const result = Money.tryCreate(5000, 'INR')
      expect(result.isSuccess).toBe(true)
      expect(result.value?.toNumber()).toBe(5000)
    })

    it('should fail tryCreate with invalid input', () => {
      const result = Money.tryCreate('invalid', 'INR')
      expect(result.isFailure).toBe(true)
      expect(result.error).toBeInstanceOf(ValidationException)
    })
  })

  describe('operations', () => {
    it('should add money', () => {
      const a = Money.fromINR(1000)
      const b = Money.fromINR(500)
      const result = a.add(b)
      
      expect(result.toNumber()).toBe(1500)
      expect(a.toNumber()).toBe(1000) // Original unchanged (immutability)
    })

    it('should subtract money', () => {
      const a = Money.fromINR(1000)
      const b = Money.fromINR(300)
      const result = a.subtract(b)
      
      expect(result.toNumber()).toBe(700)
    })

    it('should multiply money', () => {
      const money = Money.fromINR(100)
      const result = money.multiply(3)
      
      expect(result.toNumber()).toBe(300)
    })

    it('should divide money', () => {
      const money = Money.fromINR(1000)
      const result = money.divide(4)
      
      expect(result.toNumber()).toBe(250)
    })

    it('should calculate percentage', () => {
      const money = Money.fromINR(1000)
      const result = money.percentage(10)
      
      expect(result.toNumber()).toBe(100)
    })

    it('should throw error when adding different currencies', () => {
      const inr = Money.fromINR(1000)
      const usd = Money.fromDecimal(new Decimal(1000), 'USD')
      
      expect(() => inr.add(usd)).toThrow(ValidationException)
    })
  })

  describe('comparisons', () => {
    it('should compare greater than', () => {
      const a = Money.fromINR(1000)
      const b = Money.fromINR(500)
      
      expect(a.isGreaterThan(b)).toBe(true)
      expect(b.isGreaterThan(a)).toBe(false)
    })

    it('should compare less than', () => {
      const a = Money.fromINR(500)
      const b = Money.fromINR(1000)
      
      expect(a.isLessThan(b)).toBe(true)
      expect(b.isLessThan(a)).toBe(false)
    })

    it('should identify positive money', () => {
      const positive = Money.fromINR(100)
      const zero = Money.zero()
      const negative = Money.fromINR(-100)
      
      expect(positive.isPositive()).toBe(true)
      expect(zero.isPositive()).toBe(false)
      expect(negative.isPositive()).toBe(false)
    })

    it('should identify negative money', () => {
      const negative = Money.fromINR(-100)
      expect(negative.isNegative()).toBe(true)
    })
  })

  describe('formatting', () => {
    it('should format as string', () => {
      const money = Money.fromINR(1234.56)
      expect(money.toString()).toBe('INR 1234.56')
    })

    it('should format with locale', () => {
      const money = Money.fromINR(123456.78)
      const formatted = money.format()
      expect(formatted).toContain('123') // Should have Indian number formatting
    })
  })

  describe('precision', () => {
    it('should maintain precision with Decimal', () => {
      const a = Money.fromINR('0.1')
      const b = Money.fromINR('0.2')
      const result = a.add(b)
      
      // With floats this would be 0.30000000000000004
      expect(result.toNumber()).toBe(0.3)
    })

    it('should handle large numbers without precision loss', () => {
      const large = Money.fromINR('999999999999.99')
      const result = large.add(Money.fromINR('0.01'))
      
      expect(result.toDecimal().toString()).toBe('1000000000000')
    })
  })
})
