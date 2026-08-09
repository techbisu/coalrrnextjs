-- 1. Insert the new Sec7Preparation state into workflow_states
INSERT INTO public.workflow_states 
  (workflow_code, state_code, label, description, color, icon, step_order, is_terminal)
VALUES 
  ('LAND_SCHEDULE_CBA_ACT', 'Sec7Preparation', 'Section 7 Preparation', 'Section 4 Notification completed. Preparing for Section 7 Gazette.', 'bg-blue-100 text-blue-700 border-blue-300', 'FileText', 5.1, false)
ON CONFLICT (workflow_code, state_code) DO NOTHING;

-- 2. Insert the dynamic transition into workflow_transitions
INSERT INTO public.workflow_transitions 
  (workflow_code, transition_name, label, from_state, to_state, required_role)
VALUES 
  ('LAND_SCHEDULE_CBA_ACT', 'advance_to_sec7_prep', 'Advance to Section 7 Preparation (Automated)', 'GmLreReview', 'Sec7Preparation', 'gm_lre')
ON CONFLICT (workflow_code, transition_name) DO NOTHING;
