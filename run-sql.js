const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`ALTER TABLE "public"."user_org_scope" DROP CONSTRAINT IF EXISTS chk_scope_consistency`);
  await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS uq_scope_active_per_user`);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "public"."user_org_scope" ADD CONSTRAINT chk_scope_consistency CHECK (
      (scope_level = 'HQ'   AND area_cd IS NULL     AND mine_cd IS NULL)
      OR (scope_level = 'AREA' AND area_cd IS NOT NULL AND mine_cd IS NULL)
      OR (scope_level = 'UNIT' AND area_cd IS NOT NULL AND mine_cd IS NOT NULL)
    );
  `);
  
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX uq_scope_active_per_user
      ON "public"."user_org_scope"(user_id) WHERE effective_to IS NULL;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION sync_mine_adjacency() RETURNS trigger AS $$
    BEGIN
      UPDATE "master"."mine_master" SET "adjacent_mine_ids" = array_append(
        array_remove("adjacent_mine_ids", NEW.mine_cd), NEW.mine_cd
      )
      WHERE mine_cd = ANY(NEW."adjacent_mine_ids")
        AND NOT (NEW.mine_cd = ANY("adjacent_mine_ids"));
      RETURN NEW;
    END; $$ LANGUAGE plpgsql;
  `);

  await prisma.$executeRawUnsafe(`
    DROP TRIGGER IF EXISTS trg_sync_mine_adjacency ON "master"."mine_master";
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER trg_sync_mine_adjacency
    AFTER INSERT OR UPDATE OF "adjacent_mine_ids" ON "master"."mine_master"
    FOR EACH ROW EXECUTE FUNCTION sync_mine_adjacency();
  `);

  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION val_mine_area() RETURNS trigger AS $$
    DECLARE
      m_area_cd VARCHAR(30);
    BEGIN
      IF NEW.scope_level = 'UNIT' THEN
        SELECT area_cd INTO m_area_cd FROM "master"."mine_master" WHERE mine_cd = NEW.mine_cd;
        IF m_area_cd IS NULL OR m_area_cd != NEW.area_cd THEN
          RAISE EXCEPTION 'Mine % does not belong to Area %', NEW.mine_cd, NEW.area_cd;
        END IF;
      END IF;
      RETURN NEW;
    END; $$ LANGUAGE plpgsql;
  `);

  await prisma.$executeRawUnsafe(`
    DROP TRIGGER IF EXISTS trg_val_mine_area ON "public"."user_org_scope";
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER trg_val_mine_area
    BEFORE INSERT OR UPDATE ON "public"."user_org_scope"
    FOR EACH ROW EXECUTE FUNCTION val_mine_area();
  `);

  console.log('Triggers and constraints added successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
