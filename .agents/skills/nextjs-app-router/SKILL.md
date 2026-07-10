---
name: nextjs-app-router-compliance
description: Core capability for creating or refactoring Next.js App Router files (Pages, Layouts, Server Components, Client Components, and Route Handlers). Use this whenever generating UI features or backend endpoints.
triggers: ["create page", "new api route", "build component", "nextjs route", "add client component"]
---
# Skill: Next.js App Router & Clean Architecture Compliance

## Objective
Ensure all presentation layer code strictly adheres to the Next.js App Router paradigms (React Server Components by default) and acts solely as an entryway to the application layer.

## Architectural Boundaries & Instructions

### 1. Server Components vs. Client Components (Handbook §35)
- **Default State:** All components created under `src/app/` or feature directories MUST be React Server Components (RSC) by default.
- **Client Leaf Rule:** The `'use client'` directive is STRICTLY FORBIDDEN at the page or layout level. It must only be declared at the leaf-component level (e.g., interactive buttons, forms, complex state containers).
- **Data Fetching:** Do not use client-side fetching hooks (`useEffect` or tracking states) for primary data. Fetch data inside Server Components via application layer queries and pass them down as read-only props.

### 2. Next.js Routing Structure (Handbook §2 & §32)
- **UI Routes:** Place pages under `src/app/(dashboard)/[module]/page.tsx` or matching directory slots.
- **API Routes:** Route handlers must sit under `src/app/api/[module]/route.ts`. 
- **Route Authorization:** Every single API Route Handler (`POST`, `PUT`, `DELETE`, `GET`) must validate access using the cross-cutting authorization framework before executing business code:
  ```typescript
  const auth = await authorizeApi('permission.name');
  if (auth.error) return auth.error;