# Database Seeding & Migrations

This module handles the granular and modular seeding of the database, separating concerns into individual seed files per model. It also provides a utility script for splitting large Prisma migrations into smaller, more manageable SQL chunks for easier tracking and execution.

### Data flow
`npx prisma db seed` → `prisma/seed/index.ts` → Execution of individual seed scripts (e.g., `role.seed.ts`, `mst_plot.seed.ts`) → Prisma Client → PostgreSQL Database.

For migrations: `split_migrations.js` reads a large SQL migration → generates multiple ordered directories containing smaller `migration.sql` chunks.

### Key files touched
- `prisma/seed/index.ts`: The main orchestrator that registers and executes individual seed functions.
- `prisma/seed/*.seed.ts`: Individual modular seed scripts for each database entity.
- `split_migrations.js`: Script to split single large migration SQL files into granular ordered migration folders.
- `prisma/migrations/**/*.sql`: The generated split SQL migration chunks.
- `.gitignore`: Updated to explicitly track the `prisma/migrations/**/*.sql` files instead of ignoring them.

### Packages used and why
- **fs** & **path**: Built-in Node modules used inside `split_migrations.js` to process file I/O operations efficiently without relying on external dependencies.
- **ts-node**: Configured in Prisma's package.json settings to seamlessly execute the TypeScript seed scripts without requiring a separate build step.
