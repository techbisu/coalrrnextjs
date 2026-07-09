/**
 * Base Entity class for all domain entities.
 * Entities have identity and are compared by their ID.
 */
export abstract class Entity<T> {
  protected readonly _id: T

  constructor(id: T) {
    this._id = id
  }

  get id(): T {
    return this._id
  }

  public equals(other: Entity<T>): boolean {
    if (other === null || other === undefined) {
      return false
    }
    if (this.constructor !== other.constructor) {
      return false
    }
    return this._id === other._id
  }
}