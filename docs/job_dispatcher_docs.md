# JobDispatcherService Documentation

The `JobDispatcherService` is the central nervous system for asynchronous background tasks in the COALRR application. It abstracts the queue implementation (BullMQ/Redis) away from the business logic, providing a unified dispatching mechanism that behaves optimally depending on the environment.

## 1. Single Point of Entry
All background tasks (e.g., sending emails, audit logs, notifications, syncing contexts) MUST be dispatched through this service. 

**Usage Example in a UseCase:**
```typescript
import { jobDispatcher } from '@/core/jobs/services/JobDispatcherService'

await jobDispatcher.dispatch('auditLog', { userId: '123', action: 'APPROVE' })
```
The caller never knows or cares *how* the job is executed, just that it has been handed off to the dispatcher.

## 2. Environment-Aware Routing

The dispatcher automatically alters its behavior based on the `NODE_ENV`:

### Development (`NODE_ENV=development`)
- **Synchronous Execution:** Jobs are executed immediately and synchronously in the same Node.js process.
- **No Redis Required:** Developers do not need to run a local Redis instance or a separate worker process to test background tasks.
- **Request Context:** The job is wrapped in a mock `RequestContext` (e.g., `{ userId: 'JOB: <name>' }`) so that downstream services relying on context (like audit trails) do not crash when executed outside of an HTTP request.

### Production (`NODE_ENV=production`)
- **Asynchronous Queuing (BullMQ):** Jobs are enqueued into a Redis-backed BullMQ queue.
- **Worker Processes:** A separate worker process (or serverless function consumer) is responsible for pulling from this queue and executing the handlers, freeing up the main web server thread.

## 3. The Job Registry
The service maintains a strictly typed **Job Registry** (`jobHandlers`). 
```typescript
const jobHandlers: Record<string, (payload: any) => Promise<any>> = {
  auditLog:                auditLogHandler,
  processNotificationEvent: processNotificationEvent,
  // ...
}
```
This serves as a mapping between the string identifier and the actual handler function. 
> [!IMPORTANT]
> When adding a new background job to the application, you must define the handler function in `src/core/jobs/handlers/` and register it in this dictionary. 

## 4. Connection Safety & globalThis Singleton
Next.js (especially in development with Hot Module Replacement) frequently clears and recompiles modules. If the BullMQ queue were instantiated normally, it would result in memory leaks and "Too Many Redis Connections" errors.

To solve this, the service uses a `globalThis` singleton pattern:
```typescript
const globalForQueue = globalThis as unknown as {
  _bullmqQueue: Queue | undefined
}
```
This guarantees only one active Redis connection is maintained per process, making it safe for both traditional Node environments and serverless architectures.

## 5. The Outbox "Safety-Net"
When the queue is initialized for the first time in production, the service automatically schedules a **repeatable background job** (`pollOutbox-safety-net`).

This job runs every 60 seconds (configurable via `jobConfig.outboxSafetyNetIntervalMs`) to sweep the database for any orphaned "outbox" rows that were meant to be dispatched but failed due to sudden server crashes or transient network drops. This ensures guaranteed eventual delivery of critical events.
