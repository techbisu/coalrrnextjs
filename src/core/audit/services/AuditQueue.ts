import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export type AuditEventPayload = Omit<Prisma.AuditLogCreateInput, 'id' | 'createdAt' | 'changes' | 'session'> & {
  changes?: Omit<Prisma.AuditChangeCreateWithoutAuditLogInput, 'id' | 'createdAt'>[];
  sessionId?: string;
};

class AuditQueueManager {
  private queue: AuditEventPayload[] = [];
  private isProcessing: boolean = false;
  private readonly BATCH_SIZE = 50;
  private readonly FLUSH_INTERVAL_MS = 3000;
  private timer: NodeJS.Timeout | null = null;

  constructor() {
    this.startWorker();
  }

  public push(event: AuditEventPayload) {
    this.queue.push(event);
    if (this.queue.length >= this.BATCH_SIZE) {
      this.flush();
    }
  }

  private startWorker() {
    if (typeof window !== 'undefined') return; // Ensure server-side only
    this.timer = setInterval(() => {
      this.flush();
    }, this.FLUSH_INTERVAL_MS);
  }

  private async flush() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    // Extract a batch from the queue
    const batch = this.queue.splice(0, this.BATCH_SIZE);

    try {
      // Prisma does not support deep createMany with relations in a single call natively
      // for SQLite/PostgreSQL easily without some mapping, but we can do a transaction
      await db.$transaction(
        batch.map(event => {
          const { changes, sessionId, ...auditData } = event;
          return db.auditLog.create({
            data: {
              ...auditData,
              sessionId,
              changes: changes ? { create: changes } : undefined,
            },
          });
        })
      );
    } catch (error) {
      console.error('[AuditQueue] Failed to flush batch. Pushing back to queue.', error);
      // Push back to the front of the queue to try again
      this.queue.unshift(...batch);
    } finally {
      this.isProcessing = false;
    }
  }
}

// Global singleton to survive Next.js fast refresh during dev
const globalForAudit = globalThis as unknown as {
  auditQueue: AuditQueueManager | undefined;
};

export const AuditQueue = globalForAudit.auditQueue ?? new AuditQueueManager();

if (process.env.NODE_ENV !== 'production') {
  globalForAudit.auditQueue = AuditQueue;
}
