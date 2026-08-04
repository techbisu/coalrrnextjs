BEGIN;

-- Clear old direct purchase items to prevent duplicates if running repeatedly
DELETE FROM master.checklist_requirement_rule WHERE module_code = 'LAND_ACQ_PROPOSAL' AND id LIKE '%_DP';

INSERT INTO master.checklist_requirement_rule (
    id, module_code, requirement_type, title, description, 
    input_schema, show_if, inherit_from, sync_to_parent, 
    min_responses_required, is_mandatory, display_order, local_vernacular
) VALUES (
    'SPECIFIC_PROPOSAL_DP', 'LAND_ACQ_PROPOSAL', 'document', 'Specific proposal stating purpose, justification, and detailing with respect to acquisition of land.', NULL,
    NULL, '{ "acqModeId": [6] }'::jsonb, NULL, NULL,
    1, true, 10, NULL
);
INSERT INTO master.checklist_requirement_rule (
    id, module_code, requirement_type, title, description, 
    input_schema, show_if, inherit_from, sync_to_parent, 
    min_responses_required, is_mandatory, display_order, local_vernacular
) VALUES (
    'QUANTUM_OF_LAND_DP', 'LAND_ACQ_PROPOSAL', 'boolean', 'Confirmation whether Quantum of land to be acquired is within the limit approved in Project Report/Scheme.', NULL,
    NULL, '{ "acqModeId": [6] }'::jsonb, NULL, NULL,
    1, true, 20, NULL
);
INSERT INTO master.checklist_requirement_rule (
    id, module_code, requirement_type, title, description, 
    input_schema, show_if, inherit_from, sync_to_parent, 
    min_responses_required, is_mandatory, display_order, local_vernacular
) VALUES (
    'SCHEDULE_OF_LAND_DP', 'LAND_ACQ_PROPOSAL', 'boolean', 'Schedule of land in tabular form with land type-wise and mouza-wise abstract.', NULL,
    NULL, '{ "acqModeId": [6] }'::jsonb, NULL, NULL,
    1, true, 30, NULL
);
INSERT INTO master.checklist_requirement_rule (
    id, module_code, requirement_type, title, description, 
    input_schema, show_if, inherit_from, sync_to_parent, 
    min_responses_required, is_mandatory, display_order, local_vernacular
) VALUES (
    'FORM_VII_DP', 'LAND_ACQ_PROPOSAL', 'generated_document', 'Copy of reconciliation certificate (Form-VII).', NULL,
    NULL, '{ "acqModeId": [6] }'::jsonb, NULL, NULL,
    1, true, 40, NULL
);
INSERT INTO master.checklist_requirement_rule (
    id, module_code, requirement_type, title, description, 
    input_schema, show_if, inherit_from, sync_to_parent, 
    min_responses_required, is_mandatory, display_order, local_vernacular
) VALUES (
    'REVENUE_PLAN_DP', 'LAND_ACQ_PROPOSAL', 'document', 'A revenue plan showing the boundary of the approved project area.', NULL,
    NULL, '{ "acqModeId": [6] }'::jsonb, NULL, NULL,
    1, true, 50, NULL
);
INSERT INTO master.checklist_requirement_rule (
    id, module_code, requirement_type, title, description, 
    input_schema, show_if, inherit_from, sync_to_parent, 
    min_responses_required, is_mandatory, display_order, local_vernacular
) VALUES (
    'PR_SCHEME_PAGES_DP', 'LAND_ACQ_PROPOSAL', 'document', 'Copies of relevant pages of approved PR/Scheme/Conceptual Report of the Mine/Project.', NULL,
    NULL, '{ "acqModeId": [6] }'::jsonb, NULL, NULL,
    1, true, 60, NULL
);
INSERT INTO master.checklist_requirement_rule (
    id, module_code, requirement_type, title, description, 
    input_schema, show_if, inherit_from, sync_to_parent, 
    min_responses_required, is_mandatory, display_order, local_vernacular
) VALUES (
    'STATUTORY_CLEARANCES_DP', 'LAND_ACQ_PROPOSAL', 'document', 'Copies of statutory clearances like approval obtained from DGMS etc.', NULL,
    NULL, '{ "acqModeId": [6], "HAS_STATUTORY_CLEARANCES": true }'::jsonb, NULL, NULL,
    1, true, 70, NULL
);
INSERT INTO master.checklist_requirement_rule (
    id, module_code, requirement_type, title, description, 
    input_schema, show_if, inherit_from, sync_to_parent, 
    min_responses_required, is_mandatory, display_order, local_vernacular
) VALUES (
    'FOREST_CLEARANCE_DP', 'LAND_ACQ_PROPOSAL', 'document', 'Copy of Forest Clearance.', NULL,
    NULL, '{ "acqModeId": [6], "HAS_FOREST_LAND": true }'::jsonb, NULL, NULL,
    1, true, 80, NULL
);
INSERT INTO master.checklist_requirement_rule (
    id, module_code, requirement_type, title, description, 
    input_schema, show_if, inherit_from, sync_to_parent, 
    min_responses_required, is_mandatory, display_order, local_vernacular
) VALUES (
    'FORM_XVI_DP', 'LAND_ACQ_PROPOSAL', 'generated_document', 'A FIVE-POINT certificate in Form-XVI.', NULL,
    NULL, '{ "acqModeId": [6] }'::jsonb, NULL, NULL,
    1, true, 90, NULL
);
INSERT INTO master.checklist_requirement_rule (
    id, module_code, requirement_type, title, description, 
    input_schema, show_if, inherit_from, sync_to_parent, 
    min_responses_required, is_mandatory, display_order, local_vernacular
) VALUES (
    'STANDARD_CHECK_LIST_DP', 'LAND_ACQ_PROPOSAL', 'document', 'A standard Check List as circulated through Office Order.', NULL,
    NULL, '{ "acqModeId": [6] }'::jsonb, NULL, NULL,
    1, true, 100, NULL
);
INSERT INTO master.checklist_requirement_rule (
    id, module_code, requirement_type, title, description, 
    input_schema, show_if, inherit_from, sync_to_parent, 
    min_responses_required, is_mandatory, display_order, local_vernacular
) VALUES (
    'EMPLOYMENT_INVOLVEMENT_DP', 'LAND_ACQ_PROPOSAL', 'text', 'Involvement of employment, if any (Specify exact number of employments and conditional employments).', NULL,
    NULL, '{ "acqModeId": [6], "HAS_EMPLOYMENT_INVOLVEMENT": true }'::jsonb, NULL, NULL,
    1, true, 110, NULL
);
INSERT INTO master.checklist_requirement_rule (
    id, module_code, requirement_type, title, description, 
    input_schema, show_if, inherit_from, sync_to_parent, 
    min_responses_required, is_mandatory, display_order, local_vernacular
) VALUES (
    'TECHNO_ECONOMIC_REPORT_DP', 'LAND_ACQ_PROPOSAL', 'document', 'Techno-Economic Report showing estimated total financial involvement and capital involvement.', NULL,
    NULL, '{ "acqModeId": [6] }'::jsonb, NULL, NULL,
    1, true, 120, NULL
);
INSERT INTO master.checklist_requirement_rule (
    id, module_code, requirement_type, title, description, 
    input_schema, show_if, inherit_from, sync_to_parent, 
    min_responses_required, is_mandatory, display_order, local_vernacular
) VALUES (
    'CALCULATION_SHEET_DP', 'LAND_ACQ_PROPOSAL', 'document', 'Calculation sheet showing cost of land acquisition.', NULL,
    NULL, '{ "acqModeId": [6] }'::jsonb, NULL, NULL,
    1, true, 130, NULL
);
INSERT INTO master.checklist_requirement_rule (
    id, module_code, requirement_type, title, description, 
    input_schema, show_if, inherit_from, sync_to_parent, 
    min_responses_required, is_mandatory, display_order, local_vernacular
) VALUES (
    'COMPENSATION_TENANCY_DP', 'LAND_ACQ_PROPOSAL', 'document', 'Documents to substantiate the rates of compensation of Tenancy land.', NULL,
    NULL, '{ "acqModeId": [6], "HAS_TENANCY_LAND": true }'::jsonb, NULL, NULL,
    1, true, 140, NULL
);
INSERT INTO master.checklist_requirement_rule (
    id, module_code, requirement_type, title, description, 
    input_schema, show_if, inherit_from, sync_to_parent, 
    min_responses_required, is_mandatory, display_order, local_vernacular
) VALUES (
    'MARKET_PRICE_TENANCY_DP', 'LAND_ACQ_PROPOSAL', 'document', 'Copy of Government notified market price of tenancy lands for registration cost calculation.', NULL,
    NULL, '{ "acqModeId": [6], "HAS_TENANCY_LAND": true }'::jsonb, NULL, NULL,
    1, true, 150, NULL
);
INSERT INTO master.checklist_requirement_rule (
    id, module_code, requirement_type, title, description, 
    input_schema, show_if, inherit_from, sync_to_parent, 
    min_responses_required, is_mandatory, display_order, local_vernacular
) VALUES (
    'REPORT_EXAMINATION_DP', 'LAND_ACQ_PROPOSAL', 'document', 'Report on examination of the proposal by the Area Land Cell Committee and recommendation thereof.', NULL,
    NULL, '{ "acqModeId": [6] }'::jsonb, NULL, NULL,
    1, true, 160, NULL
);
INSERT INTO master.checklist_requirement_rule (
    id, module_code, requirement_type, title, description, 
    input_schema, show_if, inherit_from, sync_to_parent, 
    min_responses_required, is_mandatory, display_order, local_vernacular
) VALUES (
    'COMPENSATION_GOVT_DP', 'LAND_ACQ_PROPOSAL', 'document', 'Documents to substantiate the rates of compensation of Government land/Patta Land.', NULL,
    NULL, '{ "acqModeId": [6], "HAS_GOVT_LAND": true }'::jsonb, NULL, NULL,
    1, true, 170, NULL
);
INSERT INTO master.checklist_requirement_rule (
    id, module_code, requirement_type, title, description, 
    input_schema, show_if, inherit_from, sync_to_parent, 
    min_responses_required, is_mandatory, display_order, local_vernacular
) VALUES (
    'COMPENSATION_FOREST_DP', 'LAND_ACQ_PROPOSAL', 'document', 'Documents to substantiate the rates of compensation of Forest land.', NULL,
    NULL, '{ "acqModeId": [6], "HAS_FOREST_LAND": true }'::jsonb, NULL, NULL,
    1, true, 180, NULL
);
INSERT INTO master.checklist_requirement_rule (
    id, module_code, requirement_type, title, description, 
    input_schema, show_if, inherit_from, sync_to_parent, 
    min_responses_required, is_mandatory, display_order, local_vernacular
) VALUES (
    'MINUTES_OF_MEETING_DP', 'LAND_ACQ_PROPOSAL', 'document', 'Minutes of meeting, if held, with landowners for their acceptance with respect to the proposed rate.', NULL,
    NULL, '{ "acqModeId": [6], "HAS_FORMAL_NEGOTIATION": true }'::jsonb, NULL, NULL,
    1, true, 190, NULL
);
INSERT INTO master.checklist_requirement_rule (
    id, module_code, requirement_type, title, description, 
    input_schema, show_if, inherit_from, sync_to_parent, 
    min_responses_required, is_mandatory, display_order, local_vernacular
) VALUES (
    'FORM_XXII_DP', 'LAND_ACQ_PROPOSAL', 'generated_document', 'Form-XXII - Proposal for purchase of Tenancy land / transfer of Government or Forest Land.', NULL,
    NULL, '{ "acqModeId": [6] }'::jsonb, NULL, NULL,
    1, true, 200, NULL
);
INSERT INTO master.checklist_requirement_rule (
    id, module_code, requirement_type, title, description, 
    input_schema, show_if, inherit_from, sync_to_parent, 
    min_responses_required, is_mandatory, display_order, local_vernacular
) VALUES (
    'AGM_RECOMMENDATION_DP', 'LAND_ACQ_PROPOSAL', 'document', 'Recommendation of the Area General Manager.', NULL,
    NULL, '{ "acqModeId": [6] }'::jsonb, NULL, NULL,
    1, true, 210, NULL
);
INSERT INTO master.checklist_requirement_rule (
    id, module_code, requirement_type, title, description, 
    input_schema, show_if, inherit_from, sync_to_parent, 
    min_responses_required, is_mandatory, display_order, local_vernacular
) VALUES (
    'TRIBAL_LAND_APPROVAL_DP', 'LAND_ACQ_PROPOSAL', 'document', 'Copy of approval of District Authority for purchase of Tribal Land.', NULL,
    NULL, '{ "acqModeId": [6], "HAS_TRIBAL_LAND": true }'::jsonb, NULL, NULL,
    1, true, 220, NULL
);
INSERT INTO master.checklist_requirement_rule (
    id, module_code, requirement_type, title, description, 
    input_schema, show_if, inherit_from, sync_to_parent, 
    min_responses_required, is_mandatory, display_order, local_vernacular
) VALUES (
    'DEBOTTAR_LAND_APPROVAL_DP', 'LAND_ACQ_PROPOSAL', 'document', 'Copy of approval of Board of Revenue for purchase of Debottar Land.', NULL,
    NULL, '{ "acqModeId": [6], "HAS_DEBOTTAR_LAND": true }'::jsonb, NULL, NULL,
    1, true, 230, NULL
);

COMMIT;
