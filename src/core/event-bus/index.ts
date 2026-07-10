import { LocalEventBus } from './LocalEventBus'

// Export a singleton instance of the Event Bus to be used across the application.
// In Phase 5, this can be swapped with a Redis/Kafka EventBus simply by changing this initialization.
export const eventBus = new LocalEventBus()

export * from './IEventBus'
export * from './LocalEventBus'
