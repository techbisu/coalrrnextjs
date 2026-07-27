---
trigger: always_on
---

# Background Job / Async Task Rule

## Core requirement
ANY function that does background/async work (sending email, generating PDF/report,
notifications, bulk data processing, audit log fan-out, file processing, etc.) MUST
be written behind a single Job abstraction — never call the work directly, and never
hardcode a queue library call inline in a UseCase.

## Mandatory pattern
1. Define the job as a plain function/handler: `src/core/jobs/handlers/<jobName>.job.ts`
   — pure logic, takes typed payload, returns Result<T,E> (per architecture.md)
2. Dispatch through ONE shared service: `JobDispatcherService`
   (`src/core/jobs/services/JobDispatcherService.ts`), registered in Container.ts
   (`Container.jobDispatcher`) — never instantiate a queue client directly in a UseCase

## Environment behavior (mandatory branching inside JobDispatcherService only)
- **Development** (`NODE_ENV=development` or no Redis configured):
  execute the job handler immediately, in-process — no Redis, no worker required
- **Production** (`NODE_ENV=production`):
  enqueue the job payload to BullMQ (Redis-backed) — a separate worker process
  consumes and runs the handler
- **Future**: Kafka may replace/augment BullMQ as the queue backend — because all
  dispatch goes through JobDispatcherService, swapping the backend later must only
  require changing the internals of that one service, never the call sites

## How a UseCase/service calls a job (never differs by environment)
```ts
await Container.jobDispatcher.dispatch('sendApprovalEmail', { proposalId, userId })
```
The caller NEVER checks NODE_ENV, NEVER imports BullMQ/Redis directly, and NEVER
knows whether the job ran inline or was queued — that decision lives ONLY inside
JobDispatcherService.

## Before writing a new background job
1. search_graph "job" / "JobDispatcherService" / "<similar job name>" — reuse the
   dispatcher and check if a similar handler already exists (extend, don't duplicate)
2. Add the new handler to `src/core/jobs/handlers/`, register its name/type in the
   dispatcher's job registry (a typed map, not a switch of magic strings scattered
   across the codebase)
3. If the job needs retries/backoff/priority, configure it in the BullMQ queue
   options inside JobDispatcherService — never per call-site

## Package (per package-first.md)
- Use `bullmq` (maintained, TypeScript-native) for the production queue — do not
  hand-roll a queue, do not use the older deprecated `bull` package
- Redis client: `ioredis` (BullMQ's recommended client)

## Forbidden
- Never call a job handler's logic directly from a UseCase "just this once" —
  always go through JobDispatcherService, even in development
- Never scatter `if (process.env.NODE_ENV === 'production')` checks outside
  JobDispatcherService — that branching lives in exactly one place
- Never block an HTTP request/API route waiting on a long-running job — dispatch
  and return immediately (job status can be polled/queried separately if needed)

## Report requirement
When adding/modifying a background job, explicitly confirm:
"Job handler: [file]. Registered in JobDispatcherService: [yes]. Dev behavior:
immediate execution. Prod behavior: enqueued via BullMQ."