-- ============================================================
-- ALTER TABLE master.checklist_requirement_rule
-- Changes:
--   1. Rename current id (VARCHAR 50) → chk_code (VARCHAR 50, UNIQUE)
--   2. Add new id column (UUID, PRIMARY KEY, gen_random_uuid())
--   3. Also fix checklist_submission.requirement_id FK type (VARCHAR 50 → UUID)
--      since it references checklist_requirement_rule.id
-- ============================================================

-- STEP 1: Drop the existing primary key constraint on id
ALTER TABLE master.checklist_requirement_rule
  DROP CONSTRAINT IF EXISTS checklist_requirement_rule_pkey CASCADE;

-- STEP 2: Rename id → chk_code
ALTER TABLE master.checklist_requirement_rule
  RENAME COLUMN id TO chk_code;

-- STEP 3: Add new UUID primary key column id
ALTER TABLE master.checklist_requirement_rule
  ADD COLUMN id UUID NOT NULL DEFAULT gen_random_uuid();

-- STEP 4: Backfill id for any existing rows (each gets a fresh UUID)
UPDATE master.checklist_requirement_rule
  SET id = gen_random_uuid()
  WHERE id IS NULL;

-- STEP 5: Add PRIMARY KEY on new id column
ALTER TABLE master.checklist_requirement_rule
  ADD CONSTRAINT checklist_requirement_rule_pkey PRIMARY KEY (id);

-- STEP 6: Add UNIQUE constraint on chk_code (replaces former PK uniqueness)
ALTER TABLE master.checklist_requirement_rule
  ADD CONSTRAINT checklist_requirement_rule_chk_code_key UNIQUE (chk_code);

-- STEP 7: Add index on chk_code for fast lookups by code
CREATE INDEX IF NOT EXISTS idx_checklist_rule_chk_code
  ON master.checklist_requirement_rule (chk_code);

-- ============================================================
-- STEP 8: Fix checklist_submission.requirement_id
-- Currently VARCHAR(50) pointing to old chk_code values.
-- We must do a data migration to update it to UUID.
-- ============================================================

-- Add a new temporary UUID column
ALTER TABLE public.checklist_submission
  ADD COLUMN new_requirement_id UUID;

-- Migrate existing data by matching the old requirement_id string with the new chk_code
UPDATE public.checklist_submission s
SET new_requirement_id = r.id
FROM master.checklist_requirement_rule r
WHERE s.requirement_id = r.chk_code;

-- Delete any submissions that reference rules that no longer exist (optional, but needed to add NOT NULL constraint)
DELETE FROM public.checklist_submission 
WHERE new_requirement_id IS NULL;

-- Drop the old string column
ALTER TABLE public.checklist_submission
  DROP COLUMN requirement_id;

-- Rename the new UUID column to requirement_id
ALTER TABLE public.checklist_submission
  RENAME COLUMN new_requirement_id TO requirement_id;

-- Ensure the column is NOT NULL
ALTER TABLE public.checklist_submission
  ALTER COLUMN requirement_id SET NOT NULL;

-- Add FK back pointing to new UUID id
ALTER TABLE public.checklist_submission
  ADD CONSTRAINT checklist_submission_requirement_id_fkey
    FOREIGN KEY (requirement_id)
    REFERENCES master.checklist_requirement_rule (id)
    ON DELETE CASCADE;

-- ============================================================
-- VERIFY
-- ============================================================
-- SELECT column_name, data_type, character_maximum_length, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'master'
--   AND table_name = 'checklist_requirement_rule'
-- ORDER BY ordinal_position;
