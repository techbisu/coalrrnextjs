# Master Data Lookup & Caching

The Master Data Lookup module (`src/core/master-lookup`) provides a unified, high-performance way to fetch, cache, and select data from the `master` schema in the database (e.g., Districts, Blocks, Mouzas, Villages).

## Architecture Overview

Master data is read-heavy and changes infrequently. To provide instant 0ms dropdowns, we use a **three-tier caching strategy**:

1. **React Query (RAM)**: Instant in-memory cache for the active session (1-hour `staleTime`).
2. **IndexedDB (Disk)**: Persistent local cache (`coalrr_master_cache`) that survives page reloads (24-hour TTL). Supports 500MB+ of data safely.
3. **Database (Source of Truth)**: The `/api/master-data/lookup/[table]` endpoint, queried only when the cache is empty, expired, or invalidated.

### The Auto-Sync Mechanism

To ensure clients never see stale data when an admin updates a master record:
- We have a version endpoint: `/api/master-data/version` which returns the `MAX(updt_ts)` across all master tables.
- The **`MasterDataPrefetcher`** (mounted in the root layout) checks this version on app load, every 5 minutes, and on window focus.
- If the server version differs from the IndexedDB stored version, the prefetcher **wipes the IndexedDB** and invalidates the React Query cache, forcing fresh fetches.

## Flow of a Dropdown Interaction

1. User opens a master dropdown (e.g., Block).
2. `useMasterQuery` checks IndexedDB.
3. If data exists and the version matches → data is served instantly (no API call).
4. `MasterAutocomplete` renders the `Combobox`.
5. User types to search: The search filters the data **client-side in-memory**, matching against the formatted label (which includes English Name, Local Vernacular, and Code).

## Key Components

### 1. `MasterDataConfig` (`src/core/config/master.config.ts`)
Defines how each master table behaves.
- `modelName`: Prisma model mapping.
- `primaryKey`: The value field.
- `labelFormat`: Custom formatter (e.g., `name | local_name | code`).
- `dbSchema`: Specifies the Postgres schema (defaults to `'master'`) for raw queries.

### 2. `MasterIDBCache` (`src/core/master-lookup/cache/MasterIDBCache.ts`)
A lightweight, async IndexedDB wrapper using raw browser APIs. Non-blocking and handles large datasets (like Mouzas) without freezing the UI.

### 3. `MasterAutocomplete` & `Combobox`
- **`MasterAutocomplete`**: The container component that hooks up `useMasterQuery` to the UI and performs client-side filtering.
- **`Combobox`** (`src/shared/components/ui/combobox.tsx`): The highly polished UI component.
  - Supports multi-line labels (name + local/code).
  - Clear button.
  - Result count hints.
  - Styled checkboxes for multi-select.
  - Fully accessible (ARIA, keyboard nav, focus rings).
  - Virtualized/native scrolling via Shadcn's `CommandList`.

## Cascading Dropdowns
For dependent dropdowns (e.g., District → Block → Mouza):
Pass the `dependsOn` prop to `MasterLookup`.
```tsx
<MasterLookup
  masterName="block"
  dependencies={{ district_lgd: selectedDistrict }}
/>
```
The query waits for `district_lgd` to be non-null before fetching, and the cache key incorporates the dependencies to store each subset separately in IndexedDB.
