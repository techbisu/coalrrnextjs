export interface IDomainEvent {
  event_name: string
  occurredOn: Date
  payload: any
}

export interface IEventBus {
  /**
   * Publishes an event to all registered subscribers.
   */
  publish(event: IDomainEvent): Promise<void>
  
  /**
   * Registers a handler for a specific event name.
   */
  subscribe(event_name: string, handler: (event: IDomainEvent) => Promise<void>): void
}
