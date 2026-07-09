/**
 * Base Value Object class.
 * Value objects are immutable and compared by their value, not identity.
 */
export abstract class ValueObject<T> {
  protected readonly _value: T

  constructor(value: T) {
    this._value = Object.freeze(value) as T
  }

  get value(): T {
    return this._value
  }

  public equals(other: ValueObject<T>): boolean {
    if (other === null || other === undefined) {
      return false
    }
    if (this.constructor !== other.constructor) {
      return false
    }
    return this.deepEqual(this._value, other._value)
  }

  private deepEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true
    if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
      return false
    }
    const keysA = Object.keys(a as object)
    const keysB = Object.keys(b as object)
    if (keysA.length !== keysB.length) return false
    return keysA.every(key => this.deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]))
  }

  public toString(): string {
    return JSON.stringify(this._value)
  }
}