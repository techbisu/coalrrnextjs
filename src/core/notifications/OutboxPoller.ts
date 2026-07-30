/**
 * OutboxPoller — reads PENDING rows from outbox_events and delivers them
 * via an injected dispatch function (breaks circular dependency with
 * JobDispatcherService).
 *
 * The dispatch function is injected at call time — OutboxPoller has zero
 * knowledge of JobDispatcherService or BullMQ.
 *
 * Delivery strategy (Option C + B per AGENTS.md):
 *   Dev / no-Redis  → JobDispatcherService runs handler in-process immediately.
 *   Prod + Redis    → JobDispatcherService enqueues to BullMQ automatically.
 *
 * Locking uses SELECT ... FOR UPDATE SKIP LOCKED to safely fan out across
 * multiple pod replicas without double-delivery.
 */
import { db } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'
import { jobConfig } from '@/core/config/job.config'

export type DispatchFn = (
  jobName: string,
  payload: any,
  options?: { priority?: number }
) => Promise<void>

export class OutboxPoller {
  async poll(
    dispatch: DispatchFn,
    batchSize = jobConfig.outboxBatchSize
  ): Promise<number> {
    const lockId = uuidv4()

    // ── 1. Claim a batch atomically (SKIP LOCKED → safe for concurrent pollers)
    await db.$executeRaw`
      UPDATE public.outbox_events
      SET status = 'PROCESSING', locked_by = ${lockId}::uuid
      WHERE id IN (
        SELECT id FROM public.outbox_events
        WHERE status = 'PENDING' AND attempts < max_attempts
        ORDER BY created_at ASC
        LIMIT ${batchSize}
        FOR UPDATE SKIP LOCKED
      )
    `

    const events = await db.$queryRaw<any[]>`
      SELECT * FROM public.outbox_events
      WHERE locked_by = ${lockId}::uuid AND status = 'PROCESSING'
    `

    if (events.length === 0) return 0

    let delivered = 0

    for (const event of events) {
      try {
        // ── 2. Dispatch via the injected fn (dev=immediate, prod=BullMQ)
        const isOtp = (event.payload as any)?.data?.type === 'OTP'
        await dispatch('processNotificationEvent', event.payload, {
          priority: isOtp ? 1 : 3,
        })

        // ── 3. Mark delivered
        await db.$executeRaw`
          UPDATE public.outbox_events
          SET status = 'DELIVERED', processed_at = now(), locked_by = NULL
          WHERE id = ${event.id}::uuid
        `
        delivered++
      } catch (err: any) {
        const newAttempts = (event.attempts ?? 0) + 1
        const newStatus =
          newAttempts >= (event.max_attempts ?? jobConfig.outboxMaxAttempts)
            ? 'FAILED'
            : 'PENDING'

        await db.$executeRaw`
          UPDATE public.outbox_events
          SET status = ${newStatus},
              attempts = ${newAttempts},
              locked_by = NULL,
              error_msg = ${err.message ?? 'unknown error'}
          WHERE id = ${event.id}::uuid
        `
        console.error(
          `[OutboxPoller] Event ${event.id} failed (attempt ${newAttempts}):`,
          err.message
        )
      }
    }

    return delivered
  }
}
