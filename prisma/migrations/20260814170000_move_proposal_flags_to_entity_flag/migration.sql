-- STEP 1: Verify / Ensure entity_flag table and constraints exist
CREATE TABLE IF NOT EXISTS "public"."entity_flag" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entity_type" VARCHAR(64) NOT NULL,
    "entity_id" VARCHAR(64) NOT NULL,
    "flag_code" VARCHAR(80) NOT NULL,
    "flag_value" JSONB NOT NULL,
    "source" VARCHAR(50) DEFAULT 'SYSTEM',
    "entry_ts" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entry_by" VARCHAR(64) DEFAULT 'system',
    "updt_by" VARCHAR(64),
    CONSTRAINT "entity_flag_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_entity_flag" ON "public"."entity_flag"("entity_type", "entity_id", "flag_code");
CREATE INDEX IF NOT EXISTS "idx_entity_flag_entity" ON "public"."entity_flag"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "idx_entity_flag_code" ON "public"."entity_flag"("flag_code");

-- Remove deprecated override columns if present
ALTER TABLE "public"."entity_flag" DROP COLUMN IF EXISTS "is_overridden";
ALTER TABLE "public"."entity_flag" DROP COLUMN IF EXISTS "override_reason";

-- STEP 2: Backfill requires_board_approval
INSERT INTO "public"."entity_flag" ("entity_type", "entity_id", "flag_code", "flag_value", "source", "entry_by")
SELECT 'acq_land_schedule', proposal_id::text, 'requires_board_approval', to_jsonb(COALESCE(requires_board_approval, false)), 'MIGRATION', 'migration_script'
FROM "acquisition"."acq_proposal"
ON CONFLICT ("entity_type", "entity_id", "flag_code") 
DO UPDATE SET "flag_value" = EXCLUDED."flag_value", "updt_ts" = CURRENT_TIMESTAMP;

-- STEP 2.1: Backfill has_debottar_land
INSERT INTO "public"."entity_flag" ("entity_type", "entity_id", "flag_code", "flag_value", "source", "entry_by")
SELECT 'acq_land_schedule', proposal_id::text, 'has_debottar_land', to_jsonb(COALESCE(has_debottar_land, false)), 'MIGRATION', 'migration_script'
FROM "acquisition"."acq_proposal"
ON CONFLICT ("entity_type", "entity_id", "flag_code") 
DO UPDATE SET "flag_value" = EXCLUDED."flag_value", "updt_ts" = CURRENT_TIMESTAMP;

-- STEP 2.2: Backfill has_tribal_land
INSERT INTO "public"."entity_flag" ("entity_type", "entity_id", "flag_code", "flag_value", "source", "entry_by")
SELECT 'acq_land_schedule', proposal_id::text, 'has_tribal_land', to_jsonb(COALESCE(has_tribal_land, false)), 'MIGRATION', 'migration_script'
FROM "acquisition"."acq_proposal"
ON CONFLICT ("entity_type", "entity_id", "flag_code") 
DO UPDATE SET "flag_value" = EXCLUDED."flag_value", "updt_ts" = CURRENT_TIMESTAMP;

-- STEP 2.3: Backfill has_formal_negotiation
INSERT INTO "public"."entity_flag" ("entity_type", "entity_id", "flag_code", "flag_value", "source", "entry_by")
SELECT 'acq_land_schedule', proposal_id::text, 'has_formal_negotiation', to_jsonb(COALESCE(has_formal_negotiation, false)), 'MIGRATION', 'migration_script'
FROM "acquisition"."acq_proposal"
ON CONFLICT ("entity_type", "entity_id", "flag_code") 
DO UPDATE SET "flag_value" = EXCLUDED."flag_value", "updt_ts" = CURRENT_TIMESTAMP;

-- STEP 2.4: Backfill is_disputed_land
INSERT INTO "public"."entity_flag" ("entity_type", "entity_id", "flag_code", "flag_value", "source", "entry_by")
SELECT 'acq_land_schedule', proposal_id::text, 'is_disputed_land', to_jsonb(COALESCE(is_disputed_land, false)), 'MIGRATION', 'migration_script'
FROM "acquisition"."acq_proposal"
ON CONFLICT ("entity_type", "entity_id", "flag_code") 
DO UPDATE SET "flag_value" = EXCLUDED."flag_value", "updt_ts" = CURRENT_TIMESTAMP;

-- STEP 3: Drop the five columns from acq_proposal
ALTER TABLE "acquisition"."acq_proposal" DROP COLUMN IF EXISTS "requires_board_approval";
ALTER TABLE "acquisition"."acq_proposal" DROP COLUMN IF EXISTS "has_debottar_land";
ALTER TABLE "acquisition"."acq_proposal" DROP COLUMN IF EXISTS "has_tribal_land";
ALTER TABLE "acquisition"."acq_proposal" DROP COLUMN IF EXISTS "has_formal_negotiation";
ALTER TABLE "acquisition"."acq_proposal" DROP COLUMN IF EXISTS "is_disputed_land";
