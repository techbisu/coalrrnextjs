import { EventEmitter } from 'events'
import { IEventBus, IDomainEvent } from './IEventBus'

export class LocalEventBus implements IEventBus {
  private emitter = new EventEmitter()

  async publish(event: IDomainEvent): Promise<void> {
    // In a real enterprise system, this might push to Redis, BullMQ, or Kafka.
    // For Phase 1, we use Node's internal EventEmitter to decouple logic synchronously/asynchronously.
    
    // We wrap emit in a Promise to allow async handling if needed, though EventEmitter is synchronous by default.
    // By using setImmediate, we offload the handlers from the current call stack, mimicking async behavior.
    setImmediate(() => {
      this.emitter.emit(event.event_name, event)
    })
  }

  subscribe(event_name: string, handler: (event: IDomainEvent) => Promise<void>): void {
    this.emitter.on(event_name, async (event: IDomainEvent) => {
      try {
        await handler(event)
      } catch (error) {
        // Core error handling for event subscribers
        console.error(`[EventBus] Error handling event ${event_name}:`, error)
      }
    })
  }
}
