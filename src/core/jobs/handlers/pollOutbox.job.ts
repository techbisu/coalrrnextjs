/**
 * pollOutbox Job Handler
 *
 * Triggered by JobDispatcherService whenever await EventBus.publish() writes
 * a new row to outbox_events.
 *
 * Dev:  executes immediately in-process (JobDispatcherService dev mode).
 * Prod: runs inside the BullMQ worker (Option B, Redis-backed).
 *
 * Circular dependency is broken by:
 *   1. OutboxPoller receives dispatch as an injected function (no import of JDS).
 *   2. Container is lazily imported at CALL time, not module load time.
 *      By the time any handler is invoked, all modules are fully initialised.
 */
import { OutboxPoller } from '@/core/notifications/OutboxPoller'

const poller = new OutboxPoller()

export async function pollOutboxHandler(_payload: unknown): Promise<void> {
  // Lazy import — Container is available at call time, not at module load time.
  // This is safe because handlers are only called after all modules are initialised.
  const { jobDispatcher } = await import('@/infrastructure/di/Container')

  const delivered = await poller.poll(
    jobDispatcher.dispatch.bind(jobDispatcher)
  )

  if (delivered > 0) {
    console.log(`[pollOutbox] Delivered ${delivered} outbox event(s)`)
  }
}
