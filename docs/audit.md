# Audit Module Documentation

## Overview
The Audit Module provides a scalable, queue-based mechanism to automatically track and log both high-level business activities and detailed SQL-level changes across the application. It closely mirrors a two-table MongoDB-style design but is backed by PostgreSQL for strong schema enforcement and relations.

## Architecture (Clean Architecture)

### 1. Database Schema
Located in the `audit` schema in PostgreSQL:
- **`activity_log`**: Stores high-level activity summaries (e.g. "Data Modified in table projects"). Contains user IDs, IP Addresses, and User Agents.
- **`application_log`**: Stores the raw JSON differences (`old_data`, `new_data`) for detailed SQL tracking.

### 2. Domain Layer
- **`ActivityLog` & `ApplicationLog`**: Domain entities representing the log structures.
- **`IAuditRepository`**: Abstract repository interface.

### 3. Infrastructure Layer
- **`PrismaAuditRepository`**: Persists the domain entities to the database using Prisma.
- **`JobDispatcherService`**: A centralized dispatcher (`src/core/jobs/services/JobDispatcherService.ts`) that handles asynchronous job execution. In production, this can route to BullMQ, and in development, it executes jobs immediately. The Audit module hooks into this via the `auditLog` job handler.

### 4. Application Layer
- **`AuditService`**: The facade used to dispatch jobs to the `JobDispatcherService`. Exposes `logCustomAction(payload)` for modules to manually record business-specific audit events.

### 5. Integration (Prisma Extension)
- **`PrismaAuditExtension`**: Intercepts `create`, `update`, and `delete` queries globally. It automatically captures the client's `x-forwarded-for` and `user-agent` using Next.js `headers()`, extracts the logged-in user, and pushes the raw payload to the `JobDispatcherService`. To securely and reliably fetch `oldData` during an `update`, the extension dynamically imports the database client (`db`) inside the operation callback, guaranteeing it has access to the correct state before the update completes.

### 6. Diffing & Data Storage Optimization
To minimize database bloat, the audit system intelligently filters data before storing it in `application_log`:
- **CREATE (Insert)**: Skips creating an `application_log` entry entirely. It simply creates an `activity_log` with the generated entity identifier (e.g. `Data Created in table projects (Identifier: 123)`).
- **UPDATE**: Compares `oldData` and `newData`. It filters out all untouched columns and strictly stores only the exact fields that were modified, saving massive amounts of space on wide tables.
- **DELETE**: Stores the full snapshot of the entity in `oldData` so it can be fully recovered or reviewed.

### 7. Configuration Management
- **`audit.config.ts`**: Follows the config management rules. Hardcoded parameters like `ignoreFields` and queue retries are abstracted into `src/core/config/audit.config.ts`.

## Usage

### 1. Automatic Logging (No Action Required)
Any Prisma `create`, `update`, or `delete` on non-excluded models is automatically intercepted and logged by the `PrismaAuditExtension`. The Client IP and User Agent are captured natively using Next.js `headers()`.

```typescript
import { db } from '@/lib/db';

// The extension automatically creates an 'application_log' with old/new diffs
// and an 'activity_log' stating "Data Modified in table project".
await db.project.update({
  where: { projCd: 'PRJ001' },
  data: { status: 1 }
});
```

### 2. Manual Business Activity Logging
To manually log a specific business event (e.g., when a user exports a file, approves a workflow, or signs a document), use the `Audit.logCustomAction` method. You do not need to manually pass `ipAddress` or `userAgent` if the action happens inside an API route wrapped with `withRequestContext`—it will automatically inherit the context!

```typescript
import { Audit } from '@/core/audit/services/AuditService';

export async function approveDocument(docId: string, userId: string) {
  // Custom business logic...
  
  // Log the custom business action. 
  // IP, UserAgent, and exact execution timestamp are automatically captured
  // from the RequestContext or the execution moment.
  await Audit.logCustomAction({
    activity: `Approved Document Workflow for Document ID: ${docId}`,
    userId: userId,
  });
}
```

### 3. Background Job Identification
Background jobs (which do not have a logged-in user) should wrap their logic in `runWithRequestContext` to explicitly identify themselves in the audit logs, rather than having a default "system" fallback or a missing user.

```typescript
import { runWithRequestContext } from '@/core/context/RequestContext'
import { db } from '@/lib/db'

export async function myBackgroundJob() {
  await runWithRequestContext({ userId: 'JOB: myBackgroundJob' }, async () => {
    // Audit logs will correctly attribute this update to "JOB: myBackgroundJob"
    await db.project.update({ ... })
  })
}
```

### 3. Emitting Custom Queue Events from Anywhere
If you are inside a core Domain Service where passing `headers()` is difficult, you can emit raw payloads using the global `auditQueue` DI singleton. 

```typescript
import { auditQueue } from '@/infrastructure/di/modules/core.di';

export class ApprovalWorkflowService {
  execute(proposalId: string, approverId: string) {
    // perform approval...
    
    auditQueue.push({
      action: 'WORKFLOW_APPROVED',
      remarks: `Proposal ${proposalId} was approved by ${approverId}`,
      user_id: approverId,
    });
  }
}
```

## Viewing Logs
The module includes a UI at `/admin/audit-logs` that provides a data grid of all activities with a built-in JSON difference viewer for expanded rows.
