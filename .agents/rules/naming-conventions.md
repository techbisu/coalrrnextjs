# Naming Conventions Rule (MANDATORY)

## Core Requirement: Strict snake_case Enforcement

To maintain consistency between the database, backend APIs, configuration payloads (e.g., Document Engine rules, UI definitions), and frontend logic, the project enforces **strict `snake_case`** for all object properties, database columns, JSON keys, and API payloads. 

### 1. Database & Schema
- All tables, columns, indexes, and relations in `schema.prisma` MUST use `snake_case` (e.g. `acq_mode_id`, `current_stage_cd`, `has_forest_land`).
- Do NOT use camelCase mappings via `@map` in Prisma unless explicitly approved for a legacy table.

### 2. JSON Payloads & Configurations
- Any JSON configuration stored in the database (e.g. `input_schema`, `show_if`, dynamic form definitions, UI widget metadata) MUST use `snake_case` keys.
- Example: `{"acq_mode": [1, 2], "current_state": "AreaVetting"}` is CORRECT. `{"acqMode": [1, 2]}` is FORBIDDEN.

### 3. API Boundaries (Requests & Responses)
- All JSON payloads sent to or from API routes (`/api/...` or Server Actions) MUST use `snake_case` keys. 
- Zod schemas validating API inputs/outputs MUST define properties in `snake_case`.

### 4. Typescript Domain & Context Objects
- Internal domain logic passing data bags (like `ConditionContext`, UI definitions, etc.) MUST stick to `snake_case` to prevent alias hell (e.g., having to map `acq_mode` to `acqMode` back and forth).
- Exceptions: 
  - Class names and Types/Interfaces MUST remain `PascalCase` (e.g., `ProposalChecklistResolver`).
  - Class methods and internal local variables inside functions MAY use `camelCase` per standard TypeScript conventions, BUT if the variable directly represents a payload key or database column that is serialized/deserialized, it SHOULD match the `snake_case` payload.

### Enforcement
- NEVER hardcode alias maps (like `if (field === 'acqMode' || field === 'acq_mode')`) to bridge casing differences.
- Fix the source to use `snake_case` instead of writing structural adapters.
