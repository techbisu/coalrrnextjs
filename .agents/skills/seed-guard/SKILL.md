---
name: seed-guard
description: MUST run before creating/editing any seed file
---
1. Check prisma/seed/ for an existing file matching the entity — if found, edit it, do not create a new one
2. After writing seed data, verify translations.seed.ts includes keys for every new label/enum/status field
3. If a temporary/one-off file was about to be created (temp.ts, fix-*.ts, quick-*.ts) —
   STOP, refuse, and edit the correct seed file instead
4. Report back explicitly: "Updated: [files]. Translations added: [yes/no + why]"
