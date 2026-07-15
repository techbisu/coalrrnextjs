$env:DATABASE_URL = "postgresql://postgres:12345@127.0.0.1:5433/coalrrnextjs?schema=public"
npx prisma migrate diff --from-empty --to-url $env:DATABASE_URL --script > db_export.sql
