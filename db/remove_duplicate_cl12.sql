BEGIN;

-- 1. Delete legacy checklist rules that were ONLY for Direct Purchase (acqModeId = 6)
-- We exclude our newly inserted '%_DP' records.
DELETE FROM master.checklist_requirement_rule 
WHERE module_code = 'LAND_ACQ_PROPOSAL' 
  AND id NOT LIKE '%_DP'
  AND show_if->'acqModeId' @> '[6]'::jsonb 
  AND jsonb_array_length(show_if->'acqModeId') = 1;

-- 2. Update legacy shared rules that included Direct Purchase alongside other modes (e.g. [1, 6, 2])
-- We remove the '6' from their arrays so they no longer trigger for Direct Purchase,
-- leaving our new precise '%_DP' rules to handle it.
UPDATE master.checklist_requirement_rule t
SET show_if = jsonb_set(
    t.show_if, 
    '{acqModeId}', 
    COALESCE(
      (SELECT jsonb_agg(e) FROM jsonb_array_elements(t.show_if->'acqModeId') e WHERE e::text != '6'),
      '[]'::jsonb
    )
)
WHERE t.module_code = 'LAND_ACQ_PROPOSAL' 
  AND t.id NOT LIKE '%_DP'
  AND t.show_if->'acqModeId' @> '[6]'::jsonb
  AND jsonb_array_length(t.show_if->'acqModeId') > 1;

COMMIT;
