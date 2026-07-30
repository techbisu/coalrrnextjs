/**
 * EventBus — atomic outbox write + trigger-based polling.
 *
 * Flow:
 *  1. Write event row to `outbox_events` in the SAME DB transaction as the
 *     business operation (pass `tx` from `db.$transaction`).
 *  2. Dispatch a `pollOutbox` job via JobDispatcherService:
 *       - Dev:  OutboxPoller runs immediately in-process (Option C).
 *       - Prod: Enqueued to BullMQ/Redis worker (Option B).
 *     A separate 60-second BullMQ repeatable safety-net catches any orphaned
 *     rows that are missed (e.g. if the dispatcher call itself fails).
 *
 * No Vercel Cron, no external scheduler — self-contained.
 */
import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'

export interface EventPayload {
  event_name: string
  module: string
  entity_id?: string | number | null
  user_id?: string
  data?: Record<string, unknown>
}

// Lazy import to avoid circular dependency (EventBus ← Container ← EventBus)
async function getDispatcher() {
  const { jobDispatcher } = await import('@/infrastructure/di/Container')
  return jobDispatcher
}

export class EventBus {
  static async publish(
    payload: EventPayload,
    tx?: Prisma.TransactionClient
  ): Promise<void> {
    // 1. Write atomically — even if step 2 crashes, the row survives in outbox_events
    const client = tx ?? db
    await (client as any).outbox_events.create({
      data: {
        event_name: payload.event_name,
        module:     payload.module,
        payload:    payload as any,
        status:     'PENDING',
      },
    })

    // 2. Trigger immediate poll — dev: in-process; prod: BullMQ
    //    Fire-and-forget: failure here is safe, the safety-net repeatable job
    //    will pick up the row within 60 seconds.
    getDispatcher()
      .then(d => d.dispatch('pollOutbox', {}))
      .catch(err => console.error('[EventBus] pollOutbox dispatch failed (safety-net will retry):', err))
  }
}
