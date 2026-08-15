-- CreateTable
CREATE TABLE "public"."entity_flag" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entity_type" VARCHAR(64) NOT NULL,
    "entity_id" VARCHAR(64) NOT NULL,
    "flag_code" VARCHAR(80) NOT NULL,
    "flag_value" JSONB NOT NULL,
    "source" VARCHAR(50) DEFAULT 'SYSTEM',
    "is_overridden" BOOLEAN NOT NULL DEFAULT false,
    "override_reason" TEXT,
    "entry_ts" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entry_by" VARCHAR(64) DEFAULT 'system',
    "updt_by" VARCHAR(64),

    CONSTRAINT "entity_flag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_entity_flag" ON "public"."entity_flag"("entity_type", "entity_id", "flag_code");

-- CreateIndex
CREATE INDEX "idx_entity_flag_entity" ON "public"."entity_flag"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "idx_entity_flag_code" ON "public"."entity_flag"("flag_code");
