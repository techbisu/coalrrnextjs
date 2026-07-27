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
- **`PrismaAuditExtension`**: Intercepts `create`, `update`, and `delete` queries globally. It automatically captures the client's `x-forwarded-for` and `user-agent` using Next.js `headers()`, extracts the logged-in user, and pushes the raw payload to the `JobDispatcherService`.

### 6. Configuration Management
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
To manually log a specific business event (e.g., when a user exports a file, approves a workflow, or signs a document), use the `Audit.logCustomAction` method. 

```typescript
import { Audit } from '@/core/audit/services/AuditService';
import { getCurrentUser } from '@/lib/auth';
import { headers } from 'next/headers';

export async function approveDocument(docId: string) {
  const user = await getCurrentUser();
  const h = await headers();
  const ip = h.get('x-forwarded-for') || h.get('x-real-ip');
  
  // Custom business logic...
  
  // Log the custom business action
  await Audit.logCustomAction({
    activity: `Approved Document Workflow for Document ID: ${docId}`,
    userId: user?.id,
    ipAddress: ip,
    userAgent: h.get('user-agent')
  });
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
