/**
 * Base Aggregate Root class.
 * Aggregates are clusters of domain objects treated as a single unit.
 * They have identity and can raise domain events.
 */
import { Entity } from './Entity'
import { DomainEvent } from './DomainEvent'

export abstract class AggregateRoot<T> extends Entity<T> {
  private _domainEvents: DomainEvent[] = []

  constructor(id: T) {
    super(id)
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event)
  }

  public clearDomainEvents(): DomainEvent[] {
    const events = [...this._domainEvents]
    this._domainEvents = []
    return events
  }

  public getDomainEvents(): readonly DomainEvent[] {
    return this._domainEvents
  }
}