/**
 * Base Domain Event class.
 * Domain events represent something that happened in the domain.
 */
export interface DomainEvent {
  id: string
  occurredAt: Date
  event_type: string
  aggregateId: string
  payload: Record<string, unknown>
}

let eventCounter = 0

export function createDomainEvent<T extends Record<string, unknown>>(
  event_type: string,
  aggregateId: string,
  payload: T
): DomainEvent {
  return {
    id: `${event_type}-${aggregateId}-${Date.now()}-${++eventCounter}`,
    occurredAt: new Date(),
    event_type,
    aggregateId,
    payload,
  }
}