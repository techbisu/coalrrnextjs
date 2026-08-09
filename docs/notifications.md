# Notifications Module

**What it does:**  
The notifications module provides a centralized, event-driven framework for routing and delivering messages across different channels (IN_APP, SMS, EMAIL). It decouples business logic from notification delivery by relying on a central EventBus, which writes to an outbox for background processing.

**Data Flow:**  
Business Entity / UseCase → `EventBus.publish()` → `outbox_events` table → Background Job (`JobDispatcherService`) → `RecipientResolver` (reads `notification_rule`) → Template Engine → Notification Delivery (e.g., In-App, Email).

**Key Files Touched:**  
- `src/core/notifications/EventBus.ts`
- `src/core/notifications/services/RecipientResolver.ts`
- `prisma/seed/seed-project-notification.ts`
- `prisma/seed/seed-file-notification.ts`
- UseCases triggering events (e.g., `UploadFileUseCase.ts`, `Project.ts`)

**Packages Used:**  
- `bullmq` / `ioredis`: For robust, Redis-backed background job queuing in production.
- `@prisma/client`: For outbox writes within the same business transaction and for seeding the registry.

---

## 1. Triggering an Event from a Use Case

Never send emails or SMS directly from business logic. Always publish an event to the `EventBus`. The background workers will handle resolving who gets it and which channels they prefer.

```typescript
// src/application/use-cases/example/ApproveDocumentUseCase.ts
import { EventBus } from '@/core/notifications/EventBus'

export class ApproveDocumentUseCase {
  async execute(request: { docId: string, userId: string }) {
    // ... business logic ...

    // Publish the event (this goes to the background queue)
    await EventBus.publish({
      event_name: 'DOCUMENT_APPROVED',
      module: 'documents',
      user_id: request.userId, // The user triggering the event
      entity_id: request.docId,
      data: {
        docName: 'Annual Report',
        approvedBy: 'Admin User',
        timestamp: new Date().toISOString()
      }
    })
    
    return { success: true }
  }
}
```

---

## 2. Registering the Event & Rules in the Database (Prisma Seed)

For the background worker to know what to do with an event, you must register the event, create a template, and map it to recipients via a notification rule. We manage this through Prisma Seed scripts.

Create or update a seed file (e.g., `prisma/seed/seed-example-notification.ts`):

```typescript
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

export async function seedExampleNotification(db: PrismaClient) {
  // 1. Register Event
  const event = await db.event_registry.upsert({
    where: { event_name: 'DOCUMENT_APPROVED' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      event_name: 'DOCUMENT_APPROVED',
      module: 'documents',
      description: 'Triggered when a document is approved',
      updt_ts: new Date()
    }
  })

  // 2. Create Template
  // Notice the use of {{docName}} mustache syntax for variables
  const template = await db.notification_template.upsert({
    where: { code: 'TPL_DOC_APPROVED_INAPP' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      code: 'TPL_DOC_APPROVED_INAPP',
      channel: 'IN_APP',
      subject: 'Document Approved: {{docName}}',
      body: 'The document {{docName}} was approved by {{approvedBy}}.',
      updt_ts: new Date()
    }
  })

  // 3. Create Rule (Mapping Event + Template to a Role)
  const existingRule = await db.notification_rule.findFirst({
    where: { event_id: event.id, template_id: template.id, recipient_resolver: 'Role:Super Administrator' }
  })
  if (!existingRule) {
    await db.notification_rule.create({
      data: {
        id: crypto.randomUUID(),
        event_id: event.id,
        template_id: template.id,
        recipient_resolver: 'Role:Super Administrator',
        is_active: true,
        updt_ts: new Date()
      }
    })
  }
}
```

After creating the script, ensure it is executed in `prisma/seed/index.ts`.

---

## 3. Recipient Resolver Strategies

The `recipient_resolver` column dictates who receives the notification. It supports the following formats:

| Format / Strategy | Description | Example Target |
| :--- | :--- | :--- |
| `EventUser` | Sends the notification to the user who triggered the event (the `user_id` passed into `EventBus.publish`). | The user who clicked "Submit". |
| `Role:<RoleName>` | Sends the notification to **all** users who currently hold the specified role. | `Role:Unit Officer` |
| `SpecificUser:<ID>` | Sends the notification to a single, hardcoded User ID. | `SpecificUser:b3a1f9...` |

---

## 4. Notification Variables (Mustache templating)

When writing `body` or `subject` for a template, you can inject any variable passed inside the `data` object of `EventBus.publish` using double curly braces: `{{variableName}}`.

If you publish:
```json
{ "data": { "amount": 500, "user": { "name": "John" } } }
```
Your template can be:
`Hello {{user.name}}, a payment of ₹{{amount}} was received.`
