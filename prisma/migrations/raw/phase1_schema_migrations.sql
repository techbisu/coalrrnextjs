-- Phase 1: Project Module Schema Migrations
-- Run these scripts manually against your database, then run:
-- npx prisma db pull && npx prisma generate

-- 1. project table updates
ALTER TABLE "master"."project" 
ADD COLUMN IF NOT EXISTS "tenant_id" VARCHAR(50),
ADD COLUMN IF NOT EXISTS "statutory_clearances" JSONB;

-- Foreign Key: project.tenant_id -> tenant.tenant_id
ALTER TABLE "master"."project"
ADD CONSTRAINT "fk_project_tenant" FOREIGN KEY ("tenant_id") REFERENCES "master"."tenant"("tenant_id");

-- 2. proj_aprv table updates
ALTER TABLE "master"."proj_aprv"
ADD COLUMN IF NOT EXISTS "aprv_type" VARCHAR(30),
ADD COLUMN IF NOT EXISTS "aprv_doc_id" VARCHAR(50),
ADD COLUMN IF NOT EXISTS "aprv_level" VARCHAR(30);

-- Foreign Key: proj_aprv.proj_cd -> project.proj_cd
ALTER TABLE "master"."proj_aprv"
ADD CONSTRAINT "fk_proj_aprv_project" FOREIGN KEY ("proj_cd") REFERENCES "master"."project"("proj_cd");

-- 3. proj_aprv_location table updates
ALTER TABLE "master"."proj_aprv_location"
ADD COLUMN IF NOT EXISTS "land_class_breakup" JSONB;

-- Foreign Key: proj_aprv_location.aprv_cd -> proj_aprv.aprv_cd
ALTER TABLE "master"."proj_aprv_location"
ADD CONSTRAINT "fk_proj_aprv_location_aprv" FOREIGN KEY ("aprv_cd") REFERENCES "master"."proj_aprv"("aprv_cd");
