import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export class JobQueue {
  /**
   * Enqueues a new background job to be processed.
   */
  static async enqueue(job_type: string, payload: Record<string, any>) {
    return await db.background_job.create({
      data: {
        job_type,
        payload: JSON.stringify(payload),
        status: 'PENDING',
      },
    });
  }

  /**
   * Processes all pending jobs (up to a limit).
   * Note: This acquires a lock on the job to prevent concurrent execution.
   */
  static async processNext(limit: number = 10, processor: (type: string, payload: any) => Promise<void>) {
    const lockId = uuidv4();
    
    // 1. Find jobs to lock
    const pendingJobs = await db.background_job.findMany({
      where: {
        status: 'PENDING',
      },
      take: limit,
      orderBy: { id: 'asc' },
    });

    if (pendingJobs.length === 0) return 0;

    const jobIds = pendingJobs.map(j => j.id);

    // 2. Lock them
    await db.background_job.updateMany({
      where: {
        id: { in: jobIds },
        status: 'PENDING', // Ensure they haven't been picked up
      },
      data: {
        status: 'PROCESSING',
        locked_by: lockId,
        updt_ts: new Date(),
      },
    });

    // 3. Fetch only the successfully locked jobs
    const lockedJobs = await db.background_job.findMany({
      where: {
        id: { in: jobIds },
        locked_by: lockId,
        status: 'PROCESSING',
      },
    });

    // 4. Process them
    for (const job of lockedJobs) {
      try {
        const payload = JSON.parse(job.payload);
        await processor(job.job_type, payload);
        
        // Mark as completed
        await db.background_job.update({
          where: { id: job.id },
          data: {
            status: 'COMPLETED',
            locked_by: null,
            updt_ts: undefined,
          },
        });
      } catch (error: any) {
        // Mark as failed
        const newAttempts = job.attempts + 1;
        const newStatus = newAttempts >= job.max_attempts ? 'FAILED' : 'PENDING';
        
        await db.background_job.update({
          where: { id: job.id },
          data: {
            status: newStatus,
            attempts: newAttempts,
            locked_by: null,
            updt_ts: undefined,
          },
        });
      }
    }

    return lockedJobs.length;
  }
}
