-- ============================================================
-- INSERT INTO public.document_template
-- All form templates required by checklist_requirement_rule_seed.sql
-- Format matched from existing DB row (FORM_VII reference row).
--
-- NOTE: FORM_I, FORM_VII, FORM_XXII already exist in DB.
-- Use INSERT ... ON CONFLICT DO NOTHING to safely re-run.
-- ============================================================

INSERT INTO public.document_template
  (id, template_code, template_name, description, storage_path, config, is_active)
VALUES

-- ============================================================
-- ALREADY REGISTERED — safe upsert (existing resolvers)
-- ============================================================
(gen_random_uuid(), 'FORM_I',
 'Form I',
 'Form-I Landowner Submission',
 'templates/Form-I-Template.docx',
 '{"resolver": "FormIResolver"}',
 true),

(gen_random_uuid(), 'FORM_VII',
 'Form VII',
 'Form-VII Reconciliation Certificate',
 'templates/Form-VII-Template.docx',
 '{"resolver": "FormVIIResolver"}',
 true),

(gen_random_uuid(), 'FORM_XXII',
 'Form XXII',
 'Form-XXII Land Schedule Declaration & Notification',
 'templates/Form-XXII-Template.docx',
 '{"resolver": "FormXXIIResolver"}',
 true),

-- ============================================================
-- ACQUISITION
-- ============================================================
(gen_random_uuid(), 'FORM_XVI',
 'Form XVI',
 'Form-XVI Five-Point Certificate',
 'templates/Form-XVI-Template.docx',
 '{"resolver": "FormXVIResolver"}',
 true),

-- ============================================================
-- POSSESSION
-- ============================================================
(gen_random_uuid(), 'FORM_VIII',
 'Form VIII',
 'Form-VIII Land Utilization Certificate',
 'templates/Form-VIII-Template.docx',
 '{"resolver": "FormVIIIResolver"}',
 true),

-- ============================================================
-- EMPLOYMENT PROPOSAL
-- ============================================================
(gen_random_uuid(), 'FORM_A',
 'Form A',
 'Form-A Employment Application',
 'templates/Form-A-Template.docx',
 '{"resolver": "FormAResolver"}',
 true),

(gen_random_uuid(), 'FORM_B',
 'Form B',
 'Form-B Land Details for Employment Offer',
 'templates/Form-B-Template.docx',
 '{"resolver": "FormBResolver"}',
 true),

(gen_random_uuid(), 'FORM_C',
 'Form C',
 'Form-C Land Valuation Certificate for Employment',
 'templates/Form-C-Template.docx',
 '{"resolver": "FormCResolver"}',
 true),

(gen_random_uuid(), 'FORM_VI',
 'Form VI',
 'Form-VI Self-Declaration Certificate by Nominee',
 'templates/Form-VI-Template.docx',
 '{"resolver": "FormVIResolver"}',
 true),

(gen_random_uuid(), 'FORM_IV',
 'Form IV',
 'Form-IV Land Possession Document',
 'templates/Form-IV-Template.docx',
 '{"resolver": "FormIVResolver"}',
 true),

(gen_random_uuid(), 'FORM_IX',
 'Form IX',
 'Form-IX Employment Running Balance Register',
 'templates/Form-IX-Template.docx',
 '{"resolver": "FormIXResolver"}',
 true),

(gen_random_uuid(), 'FORM_X',
 'Form X',
 'Form-X Plot-wise Employment Liability Register',
 'templates/Form-X-Template.docx',
 '{"resolver": "FormXResolver"}',
 true),

(gen_random_uuid(), 'FORM_XI',
 'Form XI',
 'Form-XI Summary of Land Offered for Employment',
 'templates/Form-XI-Template.docx',
 '{"resolver": "FormXIResolver"}',
 true),

(gen_random_uuid(), 'FORM_XII',
 'Form XII',
 'Form-XII Gist of Land Offered for Employment',
 'templates/Form-XII-Template.docx',
 '{"resolver": "FormXIIResolver"}',
 true),

-- ============================================================
-- PATTA LAND (Employment)
-- ============================================================
(gen_random_uuid(), 'FORM_XVIII',
 'Form XVIII',
 'Form-XVIII Status of Cancellation of Patta',
 'templates/Form-XVIII-Template.docx',
 '{"resolver": "FormXVIIIResolver"}',
 true),

(gen_random_uuid(), 'FORM_XIX',
 'Form XIX',
 'Form-XIX Affidavit of Patta-holder',
 'templates/Form-XIX-Template.docx',
 '{"resolver": "FormXIXResolver"}',
 true),

(gen_random_uuid(), 'FORM_XX',
 'Form XX',
 'Form-XX Agreement with Patta-holder',
 'templates/Form-XX-Template.docx',
 '{"resolver": "FormXXResolver"}',
 true),

-- ============================================================
-- COMPENSATION PAYROLL
-- ============================================================
(gen_random_uuid(), 'FORM_1A',
 'Form 1A',
 'Form-1A Compensation Payroll Tenancy and Private Land',
 'templates/Form-1A-Template.docx',
 '{"resolver": "Form1AResolver"}',
 true),

(gen_random_uuid(), 'FORM_1B',
 'Form 1B',
 'Form-1B Compensation Payroll Government and Forest Land',
 'templates/Form-1B-Template.docx',
 '{"resolver": "Form1BResolver"}',
 true)

ON CONFLICT (template_code) DO NOTHING;
