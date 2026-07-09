/**
 * Base Domain Event class.
 * Domain events represent something that happened in the domain.
 */
export interface DomainEvent {
  id: string
  occurredAt: Date
  eventType: string
  aggregateId: string
  payload: Record<string, unknown>
}

let eventCounter = 0

export function createDomainEvent<T extends Record<string, unknown>>(
  eventType: string,
  aggregateId: string,
  payload: T
): DomainEvent {
  return {
    id: `${eventType}-${aggregateId}-${Date.now()}-${++eventCounter}`,
    occurredAt: new Date(),
    eventType,
    aggregateId,
    payload,
  }
}