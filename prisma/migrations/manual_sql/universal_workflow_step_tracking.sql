-- =============================================================================
-- COALRR Universal Workflow Engine — Micro-Step Tracking DDL Migration
-- =============================================================================
-- Execute this SQL script directly in your PostgreSQL database (e.g. via psql or PgAdmin).
-- After execution, run: npx prisma db pull && npx prisma generate
-- =============================================================================

-- 1. Create process_step_group table
CREATE TABLE IF NOT EXISTS public.process_step_group (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_code VARCHAR(80) NOT NULL,
  group_code VARCHAR(80) NOT NULL,
  group_label VARCHAR(150) NOT NULL,
  required_for_transition VARCHAR(60) NOT NULL,
  description TEXT,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  entry_by VARCHAR(64) DEFAULT 'system',
  entry_ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updt_by VARCHAR(64),
  updt_ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_process_step_group UNIQUE (process_code, group_code)
);

CREATE INDEX IF NOT EXISTS idx_psg_process ON public.process_step_group (process_code, is_active);

-- 2. Create process_step_definition table
CREATE TABLE IF NOT EXISTS public.process_step_definition (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.process_step_group(id) ON DELETE CASCADE,
  step_key VARCHAR(80) NOT NULL,
  step_label VARCHAR(150) NOT NULL,
  step_order INT NOT NULL DEFAULT 0,
  required_role VARCHAR(60) NOT NULL,
  show_if JSONB,
  is_mandatory BOOLEAN NOT NULL DEFAULT true,
  entry_by VARCHAR(64) DEFAULT 'system',
  entry_ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updt_by VARCHAR(64),
  updt_ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_process_step_def UNIQUE (group_id, step_key)
);

CREATE INDEX IF NOT EXISTS idx_psd_group ON public.process_step_definition (group_id, step_order);

-- 3. Create process_step_tracking table
CREATE TABLE IF NOT EXISTS public.process_step_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES public.process_instance(id) ON DELETE CASCADE,
  entity_type VARCHAR(64) NOT NULL,
  entity_id VARCHAR(64) NOT NULL,
  step_group VARCHAR(80) NOT NULL,
  step_key VARCHAR(80) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  remarks TEXT,
  completed_by INT REFERENCES public."user"(id),
  completed_at TIMESTAMPTZ,
  entry_by VARCHAR(64) DEFAULT 'system',
  entry_ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updt_by VARCHAR(64),
  updt_ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_process_step_tracking UNIQUE (entity_type, entity_id, step_group, step_key)
);

CREATE INDEX IF NOT EXISTS idx_pst_entity ON public.process_step_tracking (entity_type, entity_id, status);
CREATE INDEX IF NOT EXISTS idx_pst_instance ON public.process_step_tracking (instance_id);

-- 4. Extend workflow_transitions with step-group and routing control columns
ALTER TABLE public.workflow_transitions
  ADD COLUMN IF NOT EXISTS required_step_group VARCHAR(80),
  ADD COLUMN IF NOT EXISTS target_role VARCHAR(60),
  ADD COLUMN IF NOT EXISTS allow_self BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS max_recipients INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS require_justification BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS allow_recommendations BOOLEAN NOT NULL DEFAULT true;
