# Localization Module

The Localization module manages platform-wide multi-language support (i18n). It bridges the Next.js `next-intl` configuration on the frontend with a simplified database architecture, enabling high-performance dynamic translations and seamless inline editing.

## Architecture & Database

We use a single, unified database table to store all translations. This flat structure is highly optimized for querying while allowing nested JSON hydration on the server.

```prisma
// prisma/schema.prisma
model translation {
  id          String   @id @default(uuid())
  module      String   // e.g., 'common', 'project_master'
  key         String   // e.g., 'nav.dashboard.label'
  value       String   // The translated string
  language_id String
  language    language @relation(fields: [language_id], references: [id])
  updt_ts     DateTime @updatedAt

  @@unique([module, key, language_id])
}
```

## Seeding Translations

To comply with our architectural rules (`.agents/rules/translations.md`), translations in `prisma/seed/translations.seed.ts` **must** be written in a deeply nested, human-readable structure by module, entity, and field. 

The seed script automatically flattens this structure (e.g., `common -> nav -> dashboard -> label` becomes `nav.dashboard.label` in the `key` column).

### Reusable Code: Seeding Example

```typescript
// Example from prisma/seed/translations.seed.ts
const translations = {
  // Module: common
  common: {
    nav: {
      dashboard: { 
        label: { en: 'Dashboard', hi: 'डैशबोर्ड' }, 
        desc: { en: 'Cross-module KPIs...' } 
      }
    }
  },
  // Module: project_master
  project_master: {
    lock_baseline_title: { en: 'Lock Baseline' },
    stats: {
      land_limit: { en: 'Land Limit' }
    }
  }
}
```

Run `npx prisma db seed` to insert these into the `translation` table.

---

## Developer Usage: Backend Use Cases

All localization logic adheres strictly to Clean Architecture via Use Cases located in `src/modules/localization/application/use-cases/`.

### Reusable Code: Fetching Paginated Translations

To build admin tables or dashboards, you should never fetch `db.translation` directly from a UI component. Use `GetTranslationsUseCase`:

```typescript
import { GetTranslationsUseCase } from '@/modules/localization/application/use-cases/GetTranslationsUseCase';

// Inside a React Server Component or Server Action
const useCase = new GetTranslationsUseCase();
const result = await useCase.execute({
  module: 'common', // Optional: filter by module ('common', 'admin', etc.)
  search: 'Dashboard', // Optional: search by key or value
  page: 1, // Optional: defaults to 1
  limit: 50, // Optional: defaults to 50
});

console.log(result.total); // Total items matching query
console.log(result.modules); // List of unique modules available
console.log(result.translations); // Array of TranslationDTO
```

### Reusable Code: Updating a Translation

If you need to programmatically update a translation value, use the `UpdateTranslationUseCase`. This ensures that caching (`LocalizationCache`) is properly invalidated across the app.

```typescript
import { UpdateTranslationUseCase } from '@/modules/localization/application/use-cases/UpdateTranslationUseCase';

const updateUseCase = new UpdateTranslationUseCase();
const response = await updateUseCase.execute({
  id: 'translation-uuid-here',
  value: 'New Translated String',
  userId: 'current-user-uuid',
});

if (response.success) {
  console.log("Updated and cache cleared!");
}
```

---

## Developer Usage: UI & React Components

The Localization module comes with a pre-built data table that strictly follows the **List of records** view type pattern prescribed in the `ui-ux-pro-max` design system.

### Reusable Code: Integrating the Localization DataTable

If you need to render the localization management UI (e.g., in an admin panel), you can drop in the `LocalizationDataTable` and `LocalizationFilters` components.

**Important:** These components rely on **Server-Side Filtering via URL Search Params** (Next.js App Router pattern). This ensures we never load thousands of translations onto the client.

```tsx
// src/app/some-admin-route/page.tsx
import { GetTranslationsUseCase } from '@/modules/localization/application/use-cases/GetTranslationsUseCase';
import { LocalizationDataTable } from '@/modules/localization/components/LocalizationDataTable';
import { LocalizationFilters } from '@/modules/localization/components/LocalizationFilters';

export default async function AdminLocalizationPage({ searchParams }: { searchParams: Promise<{ module?: string, search?: string, page?: string }> }) {
  const params = await searchParams;
  const currentModule = params.module || 'all';
  const currentSearch = params.search || '';
  const currentPage = parseInt(params.page || '1', 10);

  const useCase = new GetTranslationsUseCase();
  const data = await useCase.execute({
    module: currentModule,
    search: currentSearch,
    page: currentPage,
    limit: 15,
  });

  return (
    <div className="space-y-6">
      {/* 1. Filter Panel */}
      <LocalizationFilters 
        modules={data.modules} 
        currentModule={currentModule} 
        currentSearch={currentSearch} 
      />
      
      {/* 2. Data-dense Table with inline editing */}
      <LocalizationDataTable 
        data={data.translations} 
        total={data.total} 
        page={data.page} 
        totalPages={data.totalPages} 
      />
    </div>
  );
}
```

### Inline Editing
The `LocalizationDataTable` automatically handles inline editing. When a user edits a value, the table invokes the server action `updateTranslationAction` (located in `src/app/(dashboard)/admin/localization/actions.ts`), which wraps `UpdateTranslationUseCase`.

---

## Using Translations in the UI (`next-intl`)

Once translations are loaded into the database, you can use them in your React components using `next-intl` hooks. The module parameter dictates which translation namespace you use.

### Reusable Code: Server Components

For React Server Components, use `getTranslations` to fetch the translations asynchronously:

```tsx
import { getTranslations } from 'next-intl/server';

export default async function DashboardPage() {
  // Pass the module name ('common') to scope the translations
  const t = await getTranslations('common');

  return (
    <div>
      {/* Access nested keys via dot notation */}
      <h1>{t('nav.dashboard.label')}</h1>
      <p>{t('nav.dashboard.desc')}</p>
    </div>
  );
}
```

### Reusable Code: Client Components

For Client Components (files with `'use client'`), use the `useTranslations` hook. Make sure your component is wrapped in a `NextIntlClientProvider` at the layout level.

```tsx
'use client';

import { useTranslations } from 'next-intl';

export function NavigationMenu() {
  // Pass the module name ('common')
  const t = useTranslations('common');

  return (
    <nav>
      <ul>
        <li>{t('nav.dashboard.label')}</li>
      </ul>
    </nav>
  );
}
```
