# Event Notification Implementation Guide

This guide explains how to implement and trigger background notifications across different channels (IN_APP, SMS, EMAIL) and recipient targets (Role, EventUser, SpecificUser) using the central `EventBus` and `JobDispatcherService`.

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

## 2. Registering the Event & Rules in the Database (Raw SQL)

For the background worker to know what to do with an event like `USER_LOGIN_OTP`, you must register it in the database and create routing rules. 

**Note**: Do not use `prisma db seed`. Always use raw SQL scripts for inserting events and rules to maintain explicit control over the registry.

Create a seed file (e.g., `seed_auth_otp.sql`):

```sql
-- 1. Insert Events
INSERT INTO "event_registry" ("id", "event_name", "module", "description", "updt_ts")
VALUES 
  (gen_random_uuid(), 'USER_LOGIN_OTP', 'auth', 'Triggered when user logs in and requires OTP via SMS', NOW()),
  (gen_random_uuid(), 'USER_LOGIN_OTP_EMAIL_FALLBACK', 'auth', 'Triggered when SMS OTP fails and fallback to EMAIL is required', NOW())
ON CONFLICT ("event_name") DO NOTHING;

-- 2. Insert Templates
-- Notice the use of {{otpCode}} mustache syntax for variables
INSERT INTO "notification_template" ("id", "code", "channel", "subject", "body", "updt_ts")
VALUES 
  (gen_random_uuid(), 'TPL_LOGIN_OTP_SMS', 'SMS', NULL, 'Your COALRR login OTP is {{otpCode}}. Valid for 10 minutes.', NOW()),
  (gen_random_uuid(), 'TPL_LOGIN_OTP_EMAIL', 'EMAIL', 'COALRR Login Verification Code', '<p>Your COALRR login OTP is <b>{{otpCode}}</b>. It is valid for 10 minutes. Please do not share this code.</p>', NOW())
ON CONFLICT ("code") DO NOTHING;

-- 3. Insert Rules for SMS
-- We use subqueries to dynamically link the rule to the event and template by their unique names
INSERT INTO "notification_rule" ("id", "event_id", "template_id", "recipient_resolver", "priority", "updt_ts")
SELECT 
  gen_random_uuid(),
  (SELECT "id" FROM "event_registry" WHERE "event_name" = 'USER_LOGIN_OTP'),
  (SELECT "id" FROM "notification_template" WHERE "code" = 'TPL_LOGIN_OTP_SMS'),
  'EventUser', -- Target: The user passed in `user_id` payload
  '1',         -- Urgent Priority
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "notification_rule" 
  WHERE "event_id" = (SELECT "id" FROM "event_registry" WHERE "event_name" = 'USER_LOGIN_OTP')
  AND "template_id" = (SELECT "id" FROM "notification_template" WHERE "code" = 'TPL_LOGIN_OTP_SMS')
);

-- 4. Insert Rules for Email Fallback
INSERT INTO "notification_rule" ("id", "event_id", "template_id", "recipient_resolver", "priority", "updt_ts")
SELECT 
  gen_random_uuid(),
  (SELECT "id" FROM "event_registry" WHERE "event_name" = 'USER_LOGIN_OTP_EMAIL_FALLBACK'),
  (SELECT "id" FROM "notification_template" WHERE "code" = 'TPL_LOGIN_OTP_EMAIL'),
  'EventUser', -- Target: The user passed in `user_id` payload
  '1',         -- Urgent Priority
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "notification_rule" 
  WHERE "event_id" = (SELECT "id" FROM "event_registry" WHERE "event_name" = 'USER_LOGIN_OTP_EMAIL_FALLBACK')
  AND "template_id" = (SELECT "id" FROM "notification_template" WHERE "code" = 'TPL_LOGIN_OTP_EMAIL')
);
```

---

## 3. Recipient Resolver Strategies

The `recipient_resolver` column dictates who receives the notification. It supports the following formats:

| Format / Strategy | Description | Example Target |
| :--- | :--- | :--- |
| `EventUser` | Sends the notification to the user who triggered the event (the `user_id` passed into `EventBus.publish`). | The user who clicked "Submit". |
| `Role:<RoleName>` | Sends the notification to **all** users who currently hold the specified role. | `Role:Unit Officer` |
| `SpecificUser:<ID>` | Sends the notification to a single, hardcoded User ID. | `SpecificUser:b3a1f9...` |

---

## 4. Understanding the Priority Queue

The `priority` field in `notification_rule` determines how fast the background worker will process the job in BullMQ (Production):

- `"1"` = **Urgent** (Use only for OTPs, 2FA, and critical security alerts)
- `"2"` = **High** (Action required immediately, e.g., Approval assigned to you)
- `"3"` = **Normal** (Standard informational events, standard IN_APP logs)
- `"4"` = **Low** (Bulk reports, weekly digests)

---

## 5. Notification Variables (Mustache templating)

When writing `body` or `subject` for a template, you can inject any variable passed inside the `data` object of `EventBus.publish` using double curly braces: `{{variableName}}`.

If you publish:
```json
{ "data": { "amount": 500, "user": { "name": "John" } } }
```
Your template can be:
`Hello {{user.name}}, a payment of ₹{{amount}} was received.`
