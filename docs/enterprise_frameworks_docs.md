# COALRR Enterprise Frameworks Documentation

The COALRR platform is built on a suite of decoupled, reusable **Enterprise Frameworks** and **Engines**. This architecture ensures that business logic remains clean, scalable, and fully compliant with statutory and audit requirements. 

This document serves as the developer guide for implementing and utilizing these core frameworks.

---

## 1. URL Routing & Security Framework (`src/lib/url`)

**Purpose:** Enforces professional RESTful URLs, handles Public ID parsing, and provides cryptography for generating AES-256-GCM tokens and HMAC-SHA256 Signed URLs.

### How it works:
1. **Routing:** Business modules use the centralized `routes` registry (e.g. `routes.proposal.details('PROP-123')`) instead of concatenating strings. This ensures link structures can be updated universally.
2. **Parsing:** The application uses Next.js Catch-All Routing (`[[...slug]]`). The `UrlParser` decodes the path and maps it to the internal SPA state, dropping the user instantly into the correct module.
3. **Security:** `UrlSecurityService` operates strictly on the Node.js backend to encrypt payloads, generate time-expiring signed links, and enforce one-time usage via the `SignedUrlLog` database table.

### Implementation Guide:

#### Using the Route Registry (Client & Server Safe)
```typescript
import { routes } from '@/lib/url/UrlService'
import Link from 'next/link'

// Good: Uses Public ID and centralized registry
<Link href={routes.proposal.details(proposal.scheduleCode)}>
  View Proposal
</Link>

// Bad: Do NOT do this!
// <Link href={`/proposals/${proposal.id}`}>View</Link>
```

#### Generating a Secure Signed URL (Server Actions Only)
```typescript
import { UrlSecurityService } from '@/lib/url/UrlSecurityService'

export async function generateDownloadLink(fileId: string) {
  'use server'
  // Create a link that expires in 30 minutes, and can only be clicked ONCE
  const securePath = await UrlSecurityService.signUrl(
    `/api/files/${fileId}/download`, 
    30, // minutes
    true, // isOneTime
    fileId, 
    'DOWNLOAD'
  )
  return securePath 
  // Result: /api/files/FILE-123/download?sig=U2Fsd...&exp=1704067200000
}
```

#### Validating a Signed URL (API Routes)
```typescript
import { UrlSecurityService } from '@/lib/url/UrlSecurityService'

export async function GET(req: NextRequest) {
  const pathWithoutQuery = req.nextUrl.pathname
  const isValid = await UrlSecurityService.verifyUrl(pathWithoutQuery, req.nextUrl.searchParams)
  
  if (!isValid) return new Response('Link expired, tampered, or already used.', { status: 403 })
  
  // Proceed with file download
}
```

---

## 2. Event & Notification Framework (`src/notifications`)

**Purpose:** Decouples notification delivery from business logic. Routes abstract business events to the appropriate users via Email, SMS, Push, or In-App channels based on configurable database rules.

### Implementation Guide:
```typescript
import { EventBus } from '@/notifications/EventBus'

// Instead of writing email logic here, just publish the event:
await EventBus.publish({
  eventName: 'PROPOSAL_APPROVED',
  module: 'land-acquisition',
  userId: currentUser.id,
  entityId: proposal.id,
  data: {
    proposalCode: proposal.scheduleCode,
    ownerName: 'Ramesh Kumar',
  }
})
```

---

## 3. Enterprise Audit Framework (`src/audit`)

**Purpose:** Provides a non-blocking, immutable audit trail for all system actions to satisfy enterprise compliance requirements.

### Implementation Guide:
```typescript
import { AuditQueue } from '@/audit/services/AuditQueue'

// Fire-and-forget: The queue handles the database write asynchronously
AuditQueue.push({
  action: 'UPDATE_COMPENSATION_FACTOR',
  entityType: 'CompensationPayroll',
  entityId: payroll.id,
  userId: currentUser.id,
  details: JSON.stringify({ oldFactor: 1.0, newFactor: 1.25 })
})
```
*(Note: The `EventBus` automatically calls `AuditQueue`, so if you trigger a Notification Event, it is already audited!)*

---

## 4. Statutory Math Engine (`src/lib/engines/math`)

**Purpose:** Ensures strict financial compliance (Spec §2.1.2) by isolating all monetary calculations. **Never use JavaScript floats for money.**

### Implementation Guide:
```typescript
import { LandCompensationEngine, CompensationInput, MoneyValue } from '@/lib/engines'

// 1. Initialize input safely using strings
const input = new CompensationInput({
  landValue: MoneyValue.from("3125000.00"),
  assetValue: MoneyValue.from("450000.00"),
  yearsSinceNotification: 2,
  multiplicationFactor: "1.25"
})

// 2. Run the engine
const result = new LandCompensationEngine().calculate(input)

// 3. Save to database using .toString() (Prisma Decimal requires strings)
await db.compensationPayrollLine.create({
  data: {
    totalAward: result.total.toString(),
    solatiumAmount: result.solatium.amount.toString(),
    formulaSnapshot: JSON.stringify({ ... })
  }
})
```

---

## 5. Localization Framework (`src/localization` & `src/i18n`)

**Purpose:** Provides multi-language support (e.g., English, Hindi, Bengali) for both the ECL Internal Portal and the Public Citizen Portal.

### Implementation Guide:
**Client Component:**
```tsx
import { useAppTranslation } from '@/localization/hooks/useAppTranslation'

export function Greeting() {
  // 'common' is the namespace/file
  const t = useAppTranslation('common') 
  return <h1>{t('welcome_message')}</h1>
}
```

---

## 6. Document & File Engine (`src/lib/document-engine`)

**Purpose:** Manages secure file uploads, attachments, and automatic watermarking (e.g., stamping "ECL INTERNAL ONLY" on sensitive PDFs).

### Implementation Guide:
```typescript
import { WatermarkService } from '@/lib/document-engine/watermark-service'

// When an Area Officer downloads a document:
const fileBuffer = await fetchSecureDocument(fileId)
const watermarkedPdf = await WatermarkService.applyWatermark(
  fileBuffer, 
  `DOWNLOADED BY: ${currentUser.name} | CONFIDENTIAL`
)

return new Response(watermarkedPdf, { 
  headers: { 'Content-Type': 'application/pdf' } 
})
```

---

## 7. Enterprise Authorization Framework (`src/authorization`)

**Purpose:** Provides a robust, Spatie-compatible Role-Based Access Control (RBAC) system for the enterprise. Replaces hardcoded string roles with a dynamic, scalable permission matrix. Ensures all components and API routes are strictly protected.

### Architecture Highlights:
- **Models:** Uses `Role`, `Permission`, `RoleHasPermission`, `ModelHasRole`, and `ModelHasPermission` in PostgreSQL.
- **Performance:** In-memory `PermissionCache` caches user's full RBAC profile on the first load.
- **Middleware:** Server-side helpers to instantly reject unauthorized requests.

### Implementation Guide:

#### Protecting Client-Side UI Components
Instead of hardcoding role checks, use the `<Can>`, `<CanAny>`, `<Cannot>`, and `<RoleGuard>` React components to wrap elements:

```tsx
import { Can, CanAny, Cannot, RoleGuard } from '@/authorization'

// Protect a single action
<Can permission="proposal.edit">
  <Button>Edit Proposal</Button>
</Can>

// Allow if user has ANY of the specified permissions
<CanAny permissions={['proposal.approve', 'proposal.reject']}>
  <ApprovalPanel />
</CanAny>

// Protect via Role (less common, usually prefer permission checks)
<RoleGuard role="Area Office">
  <DashboardAreaStats />
</RoleGuard>
```

#### Using Client-Side Hooks
If you need to execute logic on the client rather than just rendering UI, use the `usePermission` hook:

```tsx
import { usePermission } from '@/authorization'

export function ActionMenu() {
  const { can, isSuperAdmin } = usePermission()

  const handleAction = () => {
    if (!can('payment.seal') && !isSuperAdmin) {
      alert('You do not have permission to seal payments.')
      return
    }
    // Proceed with action...
  }
}
```

#### Protecting Server API Routes & Server Actions
Use the `authorize` (throws Error) or `authorizeApi` (returns NextResponse object) helpers to protect your Next.js Route Handlers and Server Actions.

```typescript
import { authorize, authorizeApi } from '@/authorization'
import { NextRequest, NextResponse } from 'next/server'

// Example 1: Route Handler
export async function POST(req: NextRequest) {
  // Checks permission; returns 403 Forbidden Response if unauthorized
  const auth = await authorizeApi('project.create')
  if (auth.error) return auth.error 
  
  // They are authorized, proceed...
  const user = auth.user
  return NextResponse.json({ success: true })
}

// Example 2: Server Action
export async function updateProposalAction(formData: FormData) {
  'use server'
  // Throws an error if unauthorized, halting execution
  await authorize('proposal.edit')
  
  // Proceed with update...
}
```

#### Advanced Contextual Policies
For complex rules requiring entity context (e.g., "Can a user edit *this specific* proposal?"), use `PolicyService`. Check out `src/authorization/policies/ProposalPolicy.ts` as a reference.

```typescript
import { PolicyService } from '@/authorization'

const canEdit = await PolicyService.authorize('proposal', 'edit', currentUser, proposalEntity)
if (!canEdit) throw new Error('Cannot edit this specific proposal.')
```
