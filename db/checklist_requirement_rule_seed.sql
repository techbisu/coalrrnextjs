-- ============================================================
-- INSERT INTO master.checklist_requirement_rule
-- Final format matching real DB convention:
--   id       = gen_random_uuid()   (UUID primary key)
--   chk_code = short code like AGM_RECOMMENDATION (unique identifier)
-- ============================================================

INSERT INTO master.checklist_requirement_rule
  (id, chk_code, module_code, requirement_type, title, description,
   input_schema, show_if, is_mandatory, display_order, local_vernacular)
VALUES

-- ============================================================
-- MODULE: LAND_ACQ_PROPOSAL | Mode 1 (CBA Standard) | Base stage
-- ============================================================
(gen_random_uuid(), 'SPECIFIC_PROPOSAL', 'LAND_ACQ_PROPOSAL', 'document',
 'Specific proposal stating purpose, justification and detailing with respect to acquisition of land', NULL,
 '{"type":"document","multiple":false}',
 '{"acqModeId":[1]}', true, 10,
 'à¤­à¥‚à¤®à¤¿ à¤…à¤§à¤¿à¤—à¥à¤°à¤¹à¤£ à¤•à¥‡ à¤¸à¤‚à¤¬à¤‚à¤§ à¤®à¥‡à¤‚ à¤‰à¤¦à¥à¤¦à¥‡à¤¶à¥à¤¯, à¤”à¤šà¤¿à¤¤à¥à¤¯ à¤”à¤° à¤µà¤¿à¤µà¤°à¤£ à¤¬à¤¤à¤¾à¤¤à¥‡ à¤¹à¥à¤ à¤µà¤¿à¤¶à¤¿à¤·à¥à¤Ÿ à¤ªà¥à¤°à¤¸à¥à¤¤à¤¾à¤µ'),

(gen_random_uuid(), 'QUANTUM_LAND', 'LAND_ACQ_PROPOSAL', 'boolean',
 'Whether the Quantum of land to be acquired is within the limit approved in the Project Report / Scheme / Conceptual Report of the Mine/Project', NULL,
 '{"type":"boolean"}',
 '{"acqModeId":[1]}', true, 20,
 'à¤•à¥à¤¯à¤¾ à¤…à¤§à¤¿à¤—à¥à¤°à¤¹à¤¿à¤¤ à¤•à¥€ à¤œà¤¾à¤¨à¥‡ à¤µà¤¾à¤²à¥€ à¤­à¥‚à¤®à¤¿ à¤•à¥€ à¤®à¤¾à¤¤à¥à¤°à¤¾ à¤–à¤¦à¤¾à¤¨/à¤ªà¤°à¤¿à¤¯à¥‹à¤œà¤¨à¤¾ à¤•à¥€ à¤ªà¤°à¤¿à¤¯à¥‹à¤œà¤¨à¤¾ à¤°à¤¿à¤ªà¥‹à¤°à¥à¤Ÿ/à¤¯à¥‹à¤œà¤¨à¤¾/à¤µà¥ˆà¤šà¤¾à¤°à¤¿à¤• à¤°à¤¿à¤ªà¥‹à¤°à¥à¤Ÿ à¤®à¥‡à¤‚ à¤¸à¥à¤µà¥€à¤•à¥ƒà¤¤ à¤¸à¥€à¤®à¤¾ à¤•à¥‡ à¤­à¥€à¤¤à¤° à¤¹à¥ˆ'),

(gen_random_uuid(), 'SCHEDULE_LAND_TABULAR', 'LAND_ACQ_PROPOSAL', 'generated_document',
 'Schedule of land in tabular form with land type-wise and mouza-wise abstract', NULL,
 '{"type":"generated_document","templateCode":"FORM_XXII","template_code":"FORM_XXII","multiple":false}',
 '{"acqModeId":[1]}', true, 30,
 'à¤­à¥‚à¤®à¤¿ à¤ªà¥à¤°à¤•à¤¾à¤°-à¤µà¤¾à¤° à¤”à¤° à¤®à¥Œà¤œà¤¾-à¤µà¤¾à¤° à¤¸à¤¾à¤°à¤¾à¤‚à¤¶ à¤•à¥‡ à¤¸à¤¾à¤¥ à¤¸à¤¾à¤°à¤£à¥€à¤¬à¤¦à¥à¤§ à¤°à¥‚à¤ª à¤®à¥‡à¤‚ à¤­à¥‚à¤®à¤¿ à¤•à¥€ à¤…à¤¨à¥à¤¸à¥‚à¤šà¥€'),

(gen_random_uuid(), 'CERT_RECONCILIATION', 'LAND_ACQ_PROPOSAL', 'generated_document',
 'Copy of reconciliation certificate (Form VII)', NULL,
 '{"type":"generated_document","templateCode":"FORM_VII","template_code":"FORM_VII","multiple":false}',
 '{"acqModeId":[1]}', true, 40,
 'à¤¸à¤®à¤¾à¤§à¤¾à¤¨ à¤ªà¥à¤°à¤®à¤¾à¤£ à¤ªà¤¤à¥à¤° à¤•à¥€ à¤ªà¥à¤°à¤¤à¤¿ (Form VII)'),

(gen_random_uuid(), 'REVENUE_PLAN_BOUNDARY', 'LAND_ACQ_PROPOSAL', 'document',
 'A revenue plan showing the boundary of the approved project working area with ECL land, Govt land, Patta land, Forest land', NULL,
 '{"type":"document","multiple":false}',
 '{"acqModeId":[1]}', true, 50,
 'à¤µà¤¿à¤­à¤¿à¤¨à¥à¤¨ à¤°à¤‚à¤—à¥‹à¤‚ à¤®à¥‡à¤‚ à¤­à¥‚à¤®à¤¿ à¤ªà¥à¤°à¤•à¤¾à¤°à¥‹à¤‚ à¤•à¥‹ à¤¦à¤°à¥à¤¶à¤¾à¤¨à¥‡ à¤µà¤¾à¤²à¤¾ à¤°à¤¾à¤œà¤¸à¥à¤µ à¤®à¤¾à¤¨à¤šà¤¿à¤¤à¥à¤°'),

(gen_random_uuid(), 'COPIES_RELEVANT_PAGES_APPROVED', 'LAND_ACQ_PROPOSAL', 'document',
 'Copies of relevant pages of approved PR / Scheme / Conceptual Report of the Mine/Project', NULL,
 '{"type":"document","multiple":true}',
 '{"acqModeId":[1]}', true, 60,
 'à¤–à¤¦à¤¾à¤¨/à¤ªà¤°à¤¿à¤¯à¥‹à¤œà¤¨à¤¾ à¤•à¥€ à¤¸à¥à¤µà¥€à¤•à¥ƒà¤¤ à¤ªà¥€à¤†à¤°/à¤¯à¥‹à¤œà¤¨à¤¾/à¤µà¥ˆà¤šà¤¾à¤°à¤¿à¤• à¤°à¤¿à¤ªà¥‹à¤°à¥à¤Ÿ à¤•à¥‡ à¤ªà¥à¤°à¤¾à¤¸à¤‚à¤—à¤¿à¤• à¤ªà¥ƒà¤·à¥à¤ à¥‹à¤‚ à¤•à¥€ à¤ªà¥à¤°à¤¤à¤¿à¤¯à¤¾à¤‚'),

(gen_random_uuid(), 'CLEARANCE_DGMS', 'LAND_ACQ_PROPOSAL', 'document',
 'Copies of statutory clearances like approval obtained from DGMS etc., if obtained', NULL,
 '{"type":"document","multiple":true}',
 '{"acqModeId":[1]}', false, 70,
 'à¤µà¥ˆà¤§à¤¾à¤¨à¤¿à¤• à¤®à¤‚à¤œà¥‚à¤°à¥€ à¤•à¥€ à¤ªà¥à¤°à¤¤à¤¿à¤¯à¤¾à¤‚ à¤œà¥ˆà¤¸à¥‡ à¤¡à¥€à¤œà¥€à¤à¤®à¤à¤¸ à¤†à¤¦à¤¿ à¤¸à¥‡ à¤ªà¥à¤°à¤¾à¤ªà¥à¤¤ à¤…à¤¨à¥à¤®à¥‹à¤¦à¤¨'),

(gen_random_uuid(), 'CLEARANCE_FOREST', 'LAND_ACQ_PROPOSAL', 'document',
 'Copy of Forest Clearance, if obtained', NULL,
 '{"type":"document","multiple":false}',
 '{"acqModeId":[1],"has_forest_land":true}', true, 80,
 'à¤µà¤¨ à¤®à¤‚à¤œà¥‚à¤°à¥€ à¤•à¥€ à¤ªà¥à¤°à¤¤à¤¿, à¤¯à¤¦à¤¿ à¤ªà¥à¤°à¤¾à¤ªà¥à¤¤ à¤¹à¥‹'),

(gen_random_uuid(), 'CERT_FIVE_POINT', 'LAND_ACQ_PROPOSAL', 'generated_document',
 'A FIVE-POINT certificate in Form XVI', NULL,
 '{"type":"generated_document","templateCode":"FORM_XVI","template_code":"FORM_XVI","multiple":false}',
 '{"acqModeId":[1]}', true, 90,
 'à¤«à¥‰à¤°à¥à¤® XVI à¤®à¥‡à¤‚ à¤ªà¤¾à¤‚à¤š-à¤¬à¤¿à¤‚à¤¦à¥ (FIVE-POINT) à¤ªà¥à¤°à¤®à¤¾à¤£ à¤ªà¤¤à¥à¤°'),

(gen_random_uuid(), 'STANDARD_CHECKLIST', 'LAND_ACQ_PROPOSAL', 'document',
 'A standard Check List as per Office Order Ref. No. ECL/CMD/LRE/ANG/Check-list/1071 dated 25th Nov 2005', NULL,
 '{"type":"document","multiple":false}',
 '{"acqModeId":[1]}', true, 100,
 'à¤•à¤¾à¤°à¥à¤¯à¤¾à¤²à¤¯ à¤†à¤¦à¥‡à¤¶ à¤•à¥‡ à¤®à¤¾à¤§à¥à¤¯à¤® à¤¸à¥‡ à¤ªà¤°à¤¿à¤šà¤¾à¤²à¤¿à¤¤ à¤à¤• à¤®à¤¾à¤¨à¤• à¤šà¥‡à¤• à¤²à¤¿à¤¸à¥à¤Ÿ'),

(gen_random_uuid(), 'TECHNO_ECONOMIC_REPORT', 'LAND_ACQ_PROPOSAL', 'document',
 'Techno-Economic Report showing estimated total financial involvement for land acquisition, rehabilitation and employment', NULL,
 '{"type":"document","multiple":false}',
 '{"acqModeId":[1]}', true, 110,
 'à¤¤à¤•à¤¨à¥€à¤•à¥€-à¤†à¤°à¥à¤¥à¤¿à¤• à¤°à¤¿à¤ªà¥‹à¤°à¥à¤Ÿ à¤œà¤¿à¤¸à¤®à¥‡à¤‚ à¤•à¥à¤² à¤µà¤¿à¤¤à¥à¤¤à¥€à¤¯ à¤­à¤¾à¤—à¥€à¤¦à¤¾à¤°à¥€ à¤¦à¤¿à¤–à¤¾à¤ˆ à¤—à¤ˆ à¤¹à¥‹'),

(gen_random_uuid(), 'CALCULATION_SHEET_SHOWING_COST', 'LAND_ACQ_PROPOSAL', 'document',
 'Calculation sheet showing the cost of land acquisition', NULL,
 '{"type":"document","multiple":false}',
 '{"acqModeId":[1]}', true, 120,
 'à¤­à¥‚à¤®à¤¿ à¤…à¤§à¤¿à¤—à¥à¤°à¤¹à¤£ à¤•à¥€ à¤²à¤¾à¤—à¤¤ à¤¦à¤°à¥à¤¶à¤¾à¤¨à¥‡ à¤µà¤¾à¤²à¥€ à¤—à¤£à¤¨à¤¾ à¤ªà¤¤à¥à¤°à¤•'),

(gen_random_uuid(), 'DOCUMENTS_SUBSTANTIATE_RATES_COMPENSATION', 'LAND_ACQ_PROPOSAL', 'document',
 'Documents to substantiate the rates of compensation of Government land / Patta Land', NULL,
 '{"type":"document","multiple":true}',
 '{"acqModeId":[1]}', true, 130,
 'à¤¸à¤°à¤•à¤¾à¤°à¥€ à¤­à¥‚à¤®à¤¿/à¤ªà¤Ÿà¥à¤Ÿà¤¾ à¤­à¥‚à¤®à¤¿ à¤•à¥‡ à¤®à¥à¤†à¤µà¤œà¥‡ à¤•à¥€ à¤¦à¤°à¥‹à¤‚ à¤•à¥‹ à¤ªà¥à¤°à¤®à¤¾à¤£à¤¿à¤¤ à¤•à¤°à¤¨à¥‡ à¤µà¤¾à¤²à¥‡ à¤¦à¤¸à¥à¤¤à¤¾à¤µà¥‡à¤œ'),

(gen_random_uuid(), 'INVOLVEMENT_EMPLOYMENT_SPECIFY_NUMBER', 'LAND_ACQ_PROPOSAL', 'text',
 'Involvement of employment, if any (Specify Number of employments and conditional employments)', NULL,
 '{"type":"text","placeholder":"e.g. 5 direct, 2 conditional"}',
 '{"acqModeId":[1],"has_employment_involvement":true}', false, 140,
 'à¤°à¥‹à¤œà¤—à¤¾à¤° à¤•à¥€ à¤­à¤¾à¤—à¥€à¤¦à¤¾à¤°à¥€, à¤¯à¤¦à¤¿ à¤•à¥‹à¤ˆ à¤¹à¥‹'),

(gen_random_uuid(), 'LAND_CELL_COMMITTEE_REPORT', 'LAND_ACQ_PROPOSAL', 'document',
 'Report on examination of the proposal by the Area Land Cell Committee and recommendation thereof', NULL,
 '{"type":"document","multiple":false}',
 '{"acqModeId":[1]}', true, 150,
 'à¤•à¥à¤·à¥‡à¤¤à¥à¤°à¥€à¤¯ à¤­à¥‚à¤®à¤¿ à¤¸à¥‡à¤² à¤¸à¤®à¤¿à¤¤à¤¿ à¤¦à¥à¤µà¤¾à¤°à¤¾ à¤ªà¥à¤°à¤¸à¥à¤¤à¤¾à¤µ à¤•à¥€ à¤œà¤¾à¤‚à¤š à¤ªà¤° à¤°à¤¿à¤ªà¥‹à¤°à¥à¤Ÿ à¤”à¤° à¤‰à¤¸ à¤ªà¤° à¤¸à¤¿à¤«à¤¾à¤°à¤¿à¤¶'),

(gen_random_uuid(), 'AGM_RECOMMENDATION', 'LAND_ACQ_PROPOSAL', 'document',
 'Recommendation of the Area General Manager', NULL,
 '{"type":"document","multiple":false}',
 '{"acqModeId":[1]}', true, 160,
 'à¤•à¥à¤·à¥‡à¤¤à¥à¤°à¥€à¤¯ à¤®à¤¹à¤¾à¤ªà¥à¤°à¤¬à¤‚à¤§à¤• à¤•à¥€ à¤¸à¤‚à¤¸à¥à¤¤à¥à¤¤à¤¿/à¤¸à¤¿à¤«à¤¾à¤°à¤¿à¤¶'),

(gen_random_uuid(), 'PAF_REHAB_INVOLVED', 'LAND_ACQ_PROPOSAL', 'boolean',
 'If Rehabilitation of PAFs is involved', NULL,
 '{"type":"boolean","conditionalChecklist":{"module_code":"RR_PACKAGE","trigger":"YES"}}',
 '{"acqModeId":[1]}', false, 170,
 'à¤¯à¤¦à¤¿ PAF à¤•à¤¾ à¤ªà¥à¤¨à¤°à¥à¤µà¤¾à¤¸ à¤¶à¤¾à¤®à¤¿à¤² à¤¹à¥ˆ'),

-- ============================================================
-- MODULE: LAND_ACQ_PROPOSAL | Mode 1 | Stage N4
-- ============================================================
(gen_random_uuid(), 'CERTIFICATE_CONFIRMING_THAT_PLANS', 'LAND_ACQ_PROPOSAL', 'document',
 'Certificate confirming that the Plans or village Schedules have been prepared on basis of Survey of India Toposheet / Revenue Plan (Format No.1C)', NULL,
 '{"type":"document","multiple":false}',
 '{"acqModeId":[1],"stage":"N4"}', true, 200,
 'à¤ªà¥à¤°à¤®à¤¾à¤£à¤ªà¤¤à¥à¤° à¤œà¥‹ à¤¯à¤¹ à¤ªà¥à¤·à¥à¤Ÿà¤¿ à¤•à¤°à¤¤à¤¾ à¤¹à¥ˆ à¤•à¤¿ à¤¯à¥‹à¤œà¤¨à¤¾à¤à¤‚ à¤”à¤° à¤…à¤¨à¥à¤¸à¥‚à¤šà¤¿à¤¯à¤¾à¤‚ à¤°à¤¾à¤œà¤¸à¥à¤µ à¤…à¤­à¤¿à¤²à¥‡à¤–à¥‹à¤‚ à¤•à¥‡ à¤†à¤§à¤¾à¤° à¤ªà¤° à¤¤à¥ˆà¤¯à¤¾à¤° à¤•à¥€ à¤—à¤ˆ à¤¹à¥ˆà¤‚ (à¤ªà¥à¤°à¤¾à¤°à¥‚à¤ª 1C)'),

(gen_random_uuid(), 'CERT_NOT_LEASED_1B_N4', 'LAND_ACQ_PROPOSAL', 'document',
 'Certificate confirming area has not been leased out by State/Central Govt to any other party (Format No. 1B)', NULL,
 '{"type":"document","multiple":false}',
 '{"acqModeId":[1],"stage":"N4"}', true, 210,
 'à¤ªà¥à¤°à¤®à¤¾à¤£à¤ªà¤¤à¥à¤° à¤œà¥‹ à¤¯à¤¹ à¤ªà¥à¤·à¥à¤Ÿà¤¿ à¤•à¤°à¤¤à¤¾ à¤¹à¥ˆ à¤•à¤¿ à¤•à¥à¤·à¥‡à¤¤à¥à¤° à¤•à¥‹ à¤•à¤¿à¤¸à¥€ à¤…à¤¨à¥à¤¯ à¤ªà¤¾à¤°à¥à¤Ÿà¥€ à¤•à¥‹ à¤ªà¤Ÿà¥à¤Ÿà¥‡ à¤ªà¤° à¤¨à¤¹à¥€à¤‚ à¤¦à¤¿à¤¯à¤¾ à¤—à¤¯à¤¾ à¤¹à¥ˆ (à¤ªà¥à¤°à¤¾à¤°à¥‚à¤ª 1B)'),

(gen_random_uuid(), 'QUESTIONNAIRE_AGM_N4', 'LAND_ACQ_PROPOSAL', 'document',
 'Filled up standard format of questionnaire duly signed by the Competent Authority (Area General Manager) â€” Section 4', NULL,
 '{"type":"document","multiple":false}',
 '{"acqModeId":[1],"stage":"N4"}', true, 220,
 'à¤¸à¤•à¥à¤·à¤® à¤ªà¥à¤°à¤¾à¤§à¤¿à¤•à¤¾à¤°à¥€ à¤¦à¥à¤µà¤¾à¤°à¤¾ à¤µà¤¿à¤§à¤¿à¤µà¤¤ à¤¹à¤¸à¥à¤¤à¤¾à¤•à¥à¤·à¤°à¤¿à¤¤ à¤ªà¥à¤°à¤¶à¥à¤¨à¤¾à¤µà¤²à¥€ à¤•à¤¾ à¤­à¤°à¤¾ à¤¹à¥à¤† à¤®à¤¾à¤¨à¤• à¤ªà¥à¤°à¤¾à¤°à¥‚à¤ª (à¤§à¤¾à¤°à¤¾ 4)'),

(gen_random_uuid(), 'DRAFT_NOTI_SEC4_1D', 'LAND_ACQ_PROPOSAL', 'generated_document',
 'A proposed draft notification under Section 4(1) of the CBA Act in English and Hindi â€” Format No. 1D', NULL,
 '{"type":"generated_document","templateCode":"FORM_XXII","template_code":"FORM_XXII","multiple":false}',
 '{"acqModeId":[1],"stage":"N4"}', true, 230,
 'à¤§à¤¾à¤°à¤¾ 4(1) à¤•à¥‡ à¤¤à¤¹à¤¤ à¤ªà¥à¤°à¤¸à¥à¤¤à¤¾à¤µà¤¿à¤¤ à¤®à¤¸à¥Œà¤¦à¤¾ à¤…à¤§à¤¿à¤¸à¥‚à¤šà¤¨à¤¾ (à¤ªà¥à¤°à¤¾à¤°à¥‚à¤ª 1D)'),

(gen_random_uuid(), 'ENTRUST_OFFICIALS_N4', 'LAND_ACQ_PROPOSAL', 'boolean',
 'Will entrust suitable officials for collection of land ownership data authenticated by District Revenue Department', NULL,
 '{"type":"boolean"}',
 '{"acqModeId":[1],"stage":"N4"}', true, 240,
 'à¤­à¥‚à¤®à¤¿ à¤¸à¥à¤µà¤¾à¤®à¤¿à¤¤à¥à¤µ à¤¡à¥‡à¤Ÿà¤¾ à¤¸à¤‚à¤—à¥à¤°à¤¹ à¤•à¥‡ à¤²à¤¿à¤ à¤‰à¤šà¤¿à¤¤ à¤…à¤§à¤¿à¤•à¤¾à¤°à¤¿à¤¯à¥‹à¤‚ à¤•à¥‹ à¤¸à¥Œà¤‚à¤ªà¤¨à¥‡ à¤•à¥€ à¤ªà¥à¤°à¤¤à¤¿à¤¬à¤¦à¥à¤§à¤¤à¤¾'),

-- ============================================================
-- MODULE: LAND_ACQ_PROPOSAL | Mode 1 | Stage N7
-- ============================================================
(gen_random_uuid(), 'NOTI_SEC_7', 'LAND_ACQ_PROPOSAL', 'document',
 'Application requesting MOC for Gazette notification under Section 7(1) giving details of coal block', NULL,
 '{"type":"document","multiple":false}',
 '{"acqModeId":[1],"stage":"N7"}', true, 300,
 'à¤§à¤¾à¤°à¤¾ 7(1) à¤•à¥‡ à¤¤à¤¹à¤¤ à¤°à¤¾à¤œà¤ªà¤¤à¥à¤° à¤…à¤§à¤¿à¤¸à¥‚à¤šà¤¨à¤¾ à¤œà¤¾à¤°à¥€ à¤•à¤°à¤¨à¥‡ à¤•à¥‡ à¤²à¤¿à¤ à¤à¤®à¤“à¤¸à¥€ à¤¸à¥‡ à¤†à¤µà¥‡à¤¦à¤¨'),

(gen_random_uuid(), 'COPY_NOTI_SEC_7', 'LAND_ACQ_PROPOSAL', 'document',
 'Copy of Notification under Section 7', NULL,
 '{"type":"document","multiple":false}',
 '{"acqModeId":[1],"stage":"N7"}', true, 310,
 'à¤§à¤¾à¤°à¤¾ 7 à¤•à¥‡ à¤¤à¤¹à¤¤ à¤…à¤§à¤¿à¤¸à¥‚à¤šà¤¨à¤¾ à¤•à¥€ à¤ªà¥à¤°à¤¤à¤¿'),

(gen_random_uuid(), 'COPY_BOARD_APPROVAL', 'LAND_ACQ_PROPOSAL', 'document',
 'A copy of the Board approval', NULL,
 '{"type":"document","multiple":false}',
 '{"acqModeId":[1],"stage":"N7"}', true, 320,
 'à¤¬à¥‹à¤°à¥à¤¡ à¤•à¥‡ à¤…à¤¨à¥à¤®à¥‹à¤¦à¤¨ à¤•à¥€ à¤à¤• à¤ªà¥à¤°à¤¤à¤¿'),

(gen_random_uuid(), 'CERTIFICATE_CONFIRMING_THAT_PLANS_1', 'LAND_ACQ_PROPOSAL', 'document',
 'Certificate confirming that the Plans and Schedules have been prepared on the basis of State Revenue Authority land records (Format No.1C)', NULL,
 '{"type":"document","multiple":false}',
 '{"acqModeId":[1],"stage":"N7"}', true, 330,
 'à¤ªà¥à¤°à¤®à¤¾à¤£à¤ªà¤¤à¥à¤° à¤œà¥‹ à¤¯à¤¹ à¤ªà¥à¤·à¥à¤Ÿà¤¿ à¤•à¤°à¤¤à¤¾ à¤¹à¥ˆ à¤•à¤¿ à¤¯à¥‹à¤œà¤¨à¤¾à¤à¤‚ à¤”à¤° à¤…à¤¨à¥à¤¸à¥‚à¤šà¤¿à¤¯à¤¾à¤‚ à¤°à¤¾à¤œà¥à¤¯ à¤°à¤¾à¤œà¤¸à¥à¤µ à¤…à¤­à¤¿à¤²à¥‡à¤–à¥‹à¤‚ à¤•à¥‡ à¤†à¤§à¤¾à¤° à¤ªà¤° à¤¤à¥ˆà¤¯à¤¾à¤° à¤•à¥€ à¤—à¤ˆ à¤¹à¥ˆà¤‚ (à¤ªà¥à¤°à¤¾à¤°à¥‚à¤ª 1C)'),

(gen_random_uuid(), 'NOTI_SEC_7_1', 'LAND_ACQ_PROPOSAL', 'document',
 'Certificate confirming area proposed under Section 7(1) is same / within boundary of area notified under Section 4(1) (Format No.2B)', NULL,
 '{"type":"document","multiple":false}',
 '{"acqModeId":[1],"stage":"N7"}', true, 340,
 'à¤ªà¥à¤°à¤®à¤¾à¤£à¤ªà¤¤à¥à¤° à¤œà¥‹ à¤¯à¤¹ à¤ªà¥à¤·à¥à¤Ÿà¤¿ à¤•à¤°à¤¤à¤¾ à¤¹à¥ˆ à¤•à¤¿ à¤§à¤¾à¤°à¤¾ 7(1) à¤•à¥à¤·à¥‡à¤¤à¥à¤° à¤§à¤¾à¤°à¤¾ 4(1) à¤•à¥€ à¤¸à¥€à¤®à¤¾ à¤•à¥‡ à¤­à¥€à¤¤à¤° à¤¹à¥ˆ (à¤ªà¥à¤°à¤¾à¤°à¥‚à¤ª 2B)'),

(gen_random_uuid(), 'CERTIFICATE_INDICATING_THAT_SUFFICIENT', 'LAND_ACQ_PROPOSAL', 'document',
 'Certificate indicating that sufficient coal is available in the area proposed to be notified (Format No.2A)', NULL,
 '{"type":"document","multiple":false}',
 '{"acqModeId":[1],"stage":"N7"}', true, 350,
 'à¤ªà¥à¤°à¤®à¤¾à¤£à¤ªà¤¤à¥à¤° à¤œà¥‹ à¤¯à¤¹ à¤‡à¤‚à¤—à¤¿à¤¤ à¤•à¤°à¤¤à¤¾ à¤¹à¥ˆ à¤•à¤¿ à¤ªà¥à¤°à¤¸à¥à¤¤à¤¾à¤µà¤¿à¤¤ à¤•à¥à¤·à¥‡à¤¤à¥à¤° à¤®à¥‡à¤‚ à¤ªà¤°à¥à¤¯à¤¾à¤ªà¥à¤¤ à¤•à¥‹à¤¯à¤²à¤¾ à¤‰à¤ªà¤²à¤¬à¥à¤§ à¤¹à¥ˆ (à¤ªà¥à¤°à¤¾à¤°à¥‚à¤ª 2A)'),

(gen_random_uuid(), 'NOTI_SEC_7_3', 'LAND_ACQ_PROPOSAL', 'document',
 'Detailed plan (RF 1:4000 scale) showing total area under Section 7(1) with Section 4(1) area in different colour', NULL,
 '{"type":"document","multiple":false}',
 '{"acqModeId":[1],"stage":"N7"}', true, 360,
 'à¤§à¤¾à¤°à¤¾ 7(1) à¤•à¤¾ à¤µà¤¿à¤¸à¥à¤¤à¥ƒà¤¤ à¤°à¤¾à¤œà¤¸à¥à¤µ à¤®à¤¾à¤¨à¤šà¤¿à¤¤à¥à¤° (RF 1:4000 à¤ªà¥ˆà¤®à¤¾à¤¨à¤¾)'),

(gen_random_uuid(), 'NOTI_SEC_7_4', 'LAND_ACQ_PROPOSAL', 'generated_document',
 'Proposed draft notification under Section 7(1) of the CBA Act in English and Hindi â€” Format No. 2D', NULL,
 '{"type":"generated_document","templateCode":"FORM_XXII","template_code":"FORM_XXII","multiple":false}',
 '{"acqModeId":[1],"stage":"N7"}', true, 370,
 'à¤§à¤¾à¤°à¤¾ 7(1) à¤•à¥‡ à¤¤à¤¹à¤¤ à¤ªà¥à¤°à¤¸à¥à¤¤à¤¾à¤µà¤¿à¤¤ à¤®à¤¸à¥Œà¤¦à¤¾ à¤…à¤§à¤¿à¤¸à¥‚à¤šà¤¨à¤¾ (à¤ªà¥à¤°à¤¾à¤°à¥‚à¤ª 2D)'),

(gen_random_uuid(), 'LAND_DATA_HAS_BEEN', 'LAND_ACQ_PROPOSAL', 'boolean',
 'Whether the land data has been authenticated by concerned authorities of District Revenue Department', NULL,
 '{"type":"boolean"}',
 '{"acqModeId":[1],"stage":"N7"}', true, 380,
 'à¤•à¥à¤¯à¤¾ à¤œà¤¿à¤²à¤¾ à¤°à¤¾à¤œà¤¸à¥à¤µ à¤µà¤¿à¤­à¤¾à¤— à¤•à¥‡ à¤…à¤§à¤¿à¤•à¤¾à¤°à¤¿à¤¯à¥‹à¤‚ à¤¦à¥à¤µà¤¾à¤°à¤¾ à¤­à¥‚à¤®à¤¿ à¤¡à¥‡à¤Ÿà¤¾ à¤•à¥‹ à¤ªà¥à¤°à¤®à¤¾à¤£à¤¿à¤¤ à¤•à¤¿à¤¯à¤¾ à¤—à¤¯à¤¾ à¤¹à¥ˆ'),

(gen_random_uuid(), 'FILLED_UP_STANDARD_FORMAT', 'LAND_ACQ_PROPOSAL', 'document',
 'Filled up standard format of questionnaire duly signed by the Competent Authority (Area General Manager) â€” Section 7', NULL,
 '{"type":"document","multiple":false}',
 '{"acqModeId":[1],"stage":"N7"}', true, 390,
 'à¤¸à¤•à¥à¤·à¤® à¤ªà¥à¤°à¤¾à¤§à¤¿à¤•à¤¾à¤°à¥€ à¤¦à¥à¤µà¤¾à¤°à¤¾ à¤µà¤¿à¤§à¤¿à¤µà¤¤ à¤¹à¤¸à¥à¤¤à¤¾à¤•à¥à¤·à¤°à¤¿à¤¤ à¤ªà¥à¤°à¤¶à¥à¤¨à¤¾à¤µà¤²à¥€ à¤•à¤¾ à¤­à¤°à¤¾ à¤¹à¥à¤† à¤®à¤¾à¤¨à¤• à¤ªà¥à¤°à¤¾à¤°à¥‚à¤ª (à¤§à¤¾à¤°à¤¾ 7)'),

(gen_random_uuid(), 'CERTIFICATE_CONFIRMING_THAT_AREA', 'LAND_ACQ_PROPOSAL', 'document',
 'Certificate confirming area has not been leased out by State/Central Govt â€” Format No. 1B (Section 7)', NULL,
 '{"type":"document","multiple":false}',
 '{"acqModeId":[1],"stage":"N7"}', true, 400,
 'à¤ªà¥à¤°à¤®à¤¾à¤£à¤ªà¤¤à¥à¤° à¤œà¥‹ à¤¯à¤¹ à¤ªà¥à¤·à¥à¤Ÿà¤¿ à¤•à¤°à¤¤à¤¾ à¤¹à¥ˆ à¤•à¤¿ à¤•à¥à¤·à¥‡à¤¤à¥à¤° à¤•à¥‹ à¤•à¤¿à¤¸à¥€ à¤…à¤¨à¥à¤¯ à¤ªà¤¾à¤°à¥à¤Ÿà¥€ à¤•à¥‹ à¤ªà¤Ÿà¥à¤Ÿà¥‡ à¤ªà¤° à¤¨à¤¹à¥€à¤‚ à¤¦à¤¿à¤¯à¤¾ à¤—à¤¯à¤¾ à¤¹à¥ˆ (à¤§à¤¾à¤°à¤¾ 7)'),

(gen_random_uuid(), 'PROSPECTING_TIME_EXTENDED_THEN', 'LAND_ACQ_PROPOSAL', 'boolean',
 'If the prospecting time is extended, then the notification indicating the same may also be submitted', NULL,
 '{"type":"boolean","conditionalUpload":{"trigger":"YES","label":"Upload Extension Notification"}}',
 '{"acqModeId":[1],"stage":"N7"}', false, 410,
 'à¤¯à¤¦à¤¿ à¤ªà¥‚à¤°à¥à¤µà¥‡à¤•à¥à¤·à¤£ à¤•à¤¾ à¤¸à¤®à¤¯ à¤¬à¤¢à¤¼à¤¾à¤¯à¤¾ à¤—à¤¯à¤¾ à¤¹à¥ˆ à¤¤à¥‹ à¤…à¤§à¤¿à¤¸à¥‚à¤šà¤¨à¤¾ à¤ªà¥à¤°à¤¸à¥à¤¤à¥à¤¤ à¤•à¤°à¥‡à¤‚'),

(gen_random_uuid(), 'PUBLISH_CONTENT_NOTIFICATION_U', 'LAND_ACQ_PROPOSAL', 'boolean',
 'Publish the content of Notification u/s 7 along with the schedule of land on the website of the company and in two newspapers', NULL,
 '{"type":"boolean"}',
 '{"acqModeId":[1],"stage":"N7"}', true, 420,
 'à¤§à¤¾à¤°à¤¾ 7 à¤•à¥€ à¤…à¤§à¤¿à¤¸à¥‚à¤šà¤¨à¤¾ à¤•à¤‚à¤ªà¤¨à¥€ à¤µà¥‡à¤¬à¤¸à¤¾à¤‡à¤Ÿ à¤”à¤° à¤¸à¤®à¤¾à¤šà¤¾à¤° à¤ªà¤¤à¥à¤°à¥‹à¤‚ à¤®à¥‡à¤‚ à¤ªà¥à¤°à¤•à¤¾à¤¶à¤¿à¤¤ à¤•à¤°à¥‡à¤‚'),

(gen_random_uuid(), 'SEND_NEWSPAPER_COPIES_LRE', 'LAND_ACQ_PROPOSAL', 'boolean',
 'Send one original and one photocopy of newspaper publications to General Manager (LRE)', NULL,
 '{"type":"boolean"}',
 '{"acqModeId":[1],"stage":"N7"}', true, 430,
 'à¤¸à¤®à¤¾à¤šà¤¾à¤° à¤ªà¤¤à¥à¤° à¤ªà¥à¤°à¤•à¤¾à¤¶à¤¨à¥‹à¤‚ à¤•à¥€ à¤à¤• à¤®à¥‚à¤² à¤ªà¥à¤°à¤¤à¤¿ à¤”à¤° à¤à¤• à¤«à¥‹à¤Ÿà¥‹à¤•à¥‰à¤ªà¥€ à¤®à¤¹à¤¾à¤ªà¥à¤°à¤¬à¤‚à¤§à¤• (LRE) à¤•à¥‹ à¤­à¥‡à¤œà¥‡à¤‚'),

(gen_random_uuid(), 'NOTI_SEC_9', 'LAND_ACQ_PROPOSAL', 'boolean',
 'Submit all documents required for Notification under section 9 to General Manager (LRE)', NULL,
 '{"type":"boolean"}',
 '{"acqModeId":[1],"stage":"N7"}', true, 440,
 'à¤§à¤¾à¤°à¤¾ 9 à¤•à¥‡ à¤¤à¤¹à¤¤ à¤…à¤§à¤¿à¤¸à¥‚à¤šà¤¨à¤¾ à¤•à¥‡ à¤²à¤¿à¤ à¤†à¤µà¤¶à¥à¤¯à¤• à¤¸à¤­à¥€ à¤¦à¤¸à¥à¤¤à¤¾à¤µà¥‡à¤œ à¤®à¤¹à¤¾à¤ªà¥à¤°à¤¬à¤‚à¤§à¤• (LRE) à¤•à¥‹ à¤œà¤®à¤¾ à¤•à¤°à¥‡à¤‚'),

-- ============================================================
-- MODULE: LAND_ACQ_PROPOSAL | Mode 1 | Stage N9
-- ============================================================
(gen_random_uuid(), 'NOTI_SEC_9_1', 'LAND_ACQ_PROPOSAL', 'document',
 'Copy of Notification under Section 9', NULL,
 '{"type":"document","multiple":false}',
 '{"acqModeId":[1],"stage":"N9"}', true, 500,
 'à¤§à¤¾à¤°à¤¾ 9 à¤•à¥‡ à¤¤à¤¹à¤¤ à¤…à¤§à¤¿à¤¸à¥‚à¤šà¤¨à¤¾ à¤•à¥€ à¤ªà¥à¤°à¤¤à¤¿'),

(gen_random_uuid(), 'NOTI_SEC_9_2', 'LAND_ACQ_PROPOSAL', 'document',
 'Application requesting MOC for Section 9(1) Gazette notification with copies of Section 4(1) and 7(1) notifications', NULL,
 '{"type":"document","multiple":true}',
 '{"acqModeId":[1],"stage":"N9"}', true, 510,
 'à¤§à¤¾à¤°à¤¾ 9(1) à¤•à¥‡ à¤²à¤¿à¤ à¤à¤®à¤“à¤¸à¥€ à¤¸à¥‡ à¤†à¤µà¥‡à¤¦à¤¨ à¤…à¤¨à¥à¤°à¥‹à¤§'),

(gen_random_uuid(), 'NOTI_SEC_9_3', 'LAND_ACQ_PROPOSAL', 'generated_document',
 'Proposed draft notification under Section 9(1) of the CBA Act in English and Hindi â€” Format No. 3A', NULL,
 '{"type":"generated_document","templateCode":"FORM_XXII","template_code":"FORM_XXII","multiple":false}',
 '{"acqModeId":[1],"stage":"N9"}', true, 520,
 'à¤§à¤¾à¤°à¤¾ 9(1) à¤•à¥‡ à¤¤à¤¹à¤¤ à¤ªà¥à¤°à¤¸à¥à¤¤à¤¾à¤µà¤¿à¤¤ à¤®à¤¸à¥Œà¤¦à¤¾ à¤…à¤§à¤¿à¤¸à¥‚à¤šà¤¨à¤¾ (à¤ªà¥à¤°à¤¾à¤°à¥‚à¤ª 3A)'),

(gen_random_uuid(), 'NO_OBJECTION_CERTIFICATE_FROM', 'LAND_ACQ_PROPOSAL', 'boolean',
 'Whether No Objection Certificate from Coal Controller has been issued', NULL,
 '{"type":"boolean","conditionalUpload":{"YES":"Upload NOC","NO":"Upload newspaper publications"}}',
 '{"acqModeId":[1],"stage":"N9"}', true, 530,
 'à¤•à¥à¤¯à¤¾ à¤•à¥‹à¤¯à¤²à¤¾ à¤¨à¤¿à¤¯à¤‚à¤¤à¥à¤°à¤• à¤¸à¥‡ à¤…à¤¨à¤¾à¤ªà¤¤à¥à¤¤à¤¿ à¤ªà¥à¤°à¤®à¤¾à¤£ à¤ªà¤¤à¥à¤° (NOC) à¤œà¤¾à¤°à¥€ à¤•à¤¿à¤¯à¤¾ à¤—à¤¯à¤¾ à¤¹à¥ˆ'),

(gen_random_uuid(), 'PLAN_RF_4000_N9', 'LAND_ACQ_PROPOSAL', 'document',
 'Detailed plan (RF 1:4000) showing total area under Section 9(1) with Section 7(1) area in different colour', NULL,
 '{"type":"document","multiple":false}',
 '{"acqModeId":[1],"stage":"N9"}', true, 540,
 'à¤§à¤¾à¤°à¤¾ 9(1) à¤•à¤¾ à¤µà¤¿à¤¸à¥à¤¤à¥ƒà¤¤ à¤°à¤¾à¤œà¤¸à¥à¤µ à¤®à¤¾à¤¨à¤šà¤¿à¤¤à¥à¤° (RF 1:4000 à¤ªà¥ˆà¤®à¤¾à¤¨à¤¾)'),

(gen_random_uuid(), 'CENSUS_ACTION_PAF_N9', 'LAND_ACQ_PROPOSAL', 'boolean',
 'If PAFs are to be resettled â€” whether actions for socio-economic study/census within two months of Section 7 notification have been taken', NULL,
 '{"type":"boolean","conditionalText":true}',
 '{"acqModeId":[1],"stage":"N9","has_displacement":true}', true, 550,
 'à¤¯à¤¦à¤¿ PAFs à¤•à¤¾ à¤ªà¥à¤¨à¤°à¥à¤µà¤¾à¤¸ à¤¶à¤¾à¤®à¤¿à¤² à¤¹à¥ˆ, à¤•à¥à¤¯à¤¾ à¤œà¤¨à¤—à¤£à¤¨à¤¾ à¤•à¥‡ à¤²à¤¿à¤ à¤•à¤¾à¤°à¥à¤°à¤µà¤¾à¤ˆ à¤•à¥€ à¤—à¤ˆ à¤¹à¥ˆ'),

(gen_random_uuid(), 'QUESTIONNAIRE_AGM_N9', 'LAND_ACQ_PROPOSAL', 'document',
 'Filled up standard format of questionnaire duly signed by the Competent Authority (Area General Manager) â€” Section 9', NULL,
 '{"type":"document","multiple":false}',
 '{"acqModeId":[1],"stage":"N9"}', true, 560,
 'à¤¸à¤•à¥à¤·à¤® à¤ªà¥à¤°à¤¾à¤§à¤¿à¤•à¤¾à¤°à¥€ à¤¦à¥à¤µà¤¾à¤°à¤¾ à¤µà¤¿à¤§à¤¿à¤µà¤¤ à¤¹à¤¸à¥à¤¤à¤¾à¤•à¥à¤·à¤°à¤¿à¤¤ à¤ªà¥à¤°à¤¶à¥à¤¨à¤¾à¤µà¤²à¥€ (à¤§à¤¾à¤°à¤¾ 9)'),

(gen_random_uuid(), 'NOTI_SEC_11', 'LAND_ACQ_PROPOSAL', 'boolean',
 'Submit all documents required for Notification under section 11 to General Manager (LRE)', NULL,
 '{"type":"boolean"}',
 '{"acqModeId":[1],"stage":"N9"}', true, 570,
 'à¤§à¤¾à¤°à¤¾ 11 à¤•à¥‡ à¤²à¤¿à¤ à¤†à¤µà¤¶à¥à¤¯à¤• à¤¸à¤­à¥€ à¤¦à¤¸à¥à¤¤à¤¾à¤µà¥‡à¤œ à¤®à¤¹à¤¾à¤ªà¥à¤°à¤¬à¤‚à¤§à¤• (LRE) à¤•à¥‹ à¤œà¤®à¤¾ à¤•à¤°à¥‡à¤‚'),

-- ============================================================
-- MODULE: LAND_ACQ_PROPOSAL | Mode 1 | Stage N11
-- ============================================================
(gen_random_uuid(), 'NOTI_SEC_11_1', 'LAND_ACQ_PROPOSAL', 'document',
 'Application requesting MOC for issue of Gazette notification under Section 11(1)', NULL,
 '{"type":"document","multiple":false}',
 '{"acqModeId":[1],"stage":"N11"}', true, 600,
 'à¤§à¤¾à¤°à¤¾ 11(1) à¤•à¥‡ à¤¤à¤¹à¤¤ à¤°à¤¾à¤œà¤ªà¤¤à¥à¤° à¤…à¤§à¤¿à¤¸à¥‚à¤šà¤¨à¤¾ à¤•à¥‡ à¤²à¤¿à¤ à¤à¤®à¤“à¤¸à¥€ à¤¸à¥‡ à¤†à¤µà¥‡à¤¦à¤¨'),

(gen_random_uuid(), 'NOTI_SEC_11_2', 'LAND_ACQ_PROPOSAL', 'generated_document',
 'Draft order under Section 11(1) of the CBA Act in English and Hindi â€” Format No. 4A', NULL,
 '{"type":"generated_document","templateCode":"FORM_XXII","template_code":"FORM_XXII","multiple":false}',
 '{"acqModeId":[1],"stage":"N11"}', true, 610,
 'à¤§à¤¾à¤°à¤¾ 11(1) à¤•à¥‡ à¤¤à¤¹à¤¤ à¤®à¤¸à¥Œà¤¦à¤¾ à¤†à¤¦à¥‡à¤¶ (à¤ªà¥à¤°à¤¾à¤°à¥‚à¤ª 4A)'),

(gen_random_uuid(), 'SATELLITE_IMAGES_CAPTURED', 'LAND_ACQ_PROPOSAL', 'boolean',
 'Whether satellite images of the acquired area have been captured', NULL,
 '{"type":"boolean","conditionalText":true}',
 '{"acqModeId":[1],"stage":"N11"}', true, 620,
 'à¤•à¥à¤¯à¤¾ à¤…à¤§à¤¿à¤—à¥à¤°à¤¹à¤¿à¤¤ à¤•à¥à¤·à¥‡à¤¤à¥à¤° à¤•à¥€ à¤¸à¥ˆà¤Ÿà¥‡à¤²à¤¾à¤‡à¤Ÿ à¤¤à¤¸à¥à¤µà¥€à¤°à¥‡à¤‚ à¤²à¥€ à¤—à¤ˆ à¤¹à¥ˆà¤‚'),

(gen_random_uuid(), 'QUESTIONNAIRE_AGM_N11', 'LAND_ACQ_PROPOSAL', 'document',
 'Filled up standard format of questionnaire duly signed by the Competent Authority (Area General Manager) â€” Section 11', NULL,
 '{"type":"document","multiple":false}',
 '{"acqModeId":[1],"stage":"N11"}', true, 630,
 'à¤¸à¤•à¥à¤·à¤® à¤ªà¥à¤°à¤¾à¤§à¤¿à¤•à¤¾à¤°à¥€ à¤¦à¥à¤µà¤¾à¤°à¤¾ à¤µà¤¿à¤§à¤¿à¤µà¤¤ à¤¹à¤¸à¥à¤¤à¤¾à¤•à¥à¤·à¤°à¤¿à¤¤ à¤ªà¥à¤°à¤¶à¥à¤¨à¤¾à¤µà¤²à¥€ (à¤§à¤¾à¤°à¤¾ 11)'),

(gen_random_uuid(), 'PUBLISH_CONTENT_NOTIFICATION_U_1', 'LAND_ACQ_PROPOSAL', 'boolean',
 'Publish the content of Notification u/s 11 with land schedule on website and in two newspapers', NULL,
 '{"type":"boolean"}',
 '{"acqModeId":[1],"stage":"N11"}', true, 640,
 'à¤§à¤¾à¤°à¤¾ 11 à¤•à¥€ à¤…à¤§à¤¿à¤¸à¥‚à¤šà¤¨à¤¾ à¤•à¤‚à¤ªà¤¨à¥€ à¤µà¥‡à¤¬à¤¸à¤¾à¤‡à¤Ÿ à¤”à¤° à¤¸à¤®à¤¾à¤šà¤¾à¤° à¤ªà¤¤à¥à¤°à¥‹à¤‚ à¤®à¥‡à¤‚ à¤ªà¥à¤°à¤•à¤¾à¤¶à¤¿à¤¤ à¤•à¤°à¥‡à¤‚'),

(gen_random_uuid(), 'PASTE_COPIES_NOTIFICATION_U', 'LAND_ACQ_PROPOSAL', 'boolean',
 'Paste copies of Notification u/s 11 at Panchayat Bhawans and conspicuous places in mouzas where acquisition occurred', NULL,
 '{"type":"boolean"}',
 '{"acqModeId":[1],"stage":"N11"}', true, 650,
 'à¤§à¤¾à¤°à¤¾ 11 à¤•à¥€ à¤…à¤§à¤¿à¤¸à¥‚à¤šà¤¨à¤¾ à¤ªà¤‚à¤šà¤¾à¤¯à¤¤ à¤­à¤µà¤¨à¥‹à¤‚ à¤”à¤° à¤®à¥Œà¤œà¤¾à¤“à¤‚ à¤®à¥‡à¤‚ à¤šà¤¿à¤ªà¤•à¤¾à¤à¤‚'),

(gen_random_uuid(), 'PROCLAIM_SAME_NEARBY_AREAS', 'LAND_ACQ_PROPOSAL', 'boolean',
 'Proclaim notification in nearby areas/villages by beat of drum', NULL,
 '{"type":"boolean"}',
 '{"acqModeId":[1],"stage":"N11"}', true, 660,
 'à¤†à¤¸-à¤ªà¤¾à¤¸ à¤•à¥‡ à¤•à¥à¤·à¥‡à¤¤à¥à¤°à¥‹à¤‚/à¤—à¤¾à¤‚à¤µà¥‹à¤‚ à¤®à¥‡à¤‚ à¤¢à¥‹à¤² à¤ªà¥€à¤Ÿà¤•à¤° à¤˜à¥‹à¤·à¤£à¤¾ à¤•à¤°à¥‡à¤‚'),

(gen_random_uuid(), 'PAF_REHAB_ACTION_N11', 'LAND_ACQ_PROPOSAL', 'boolean',
 'If Rehabilitation of PAFs is involved â€” take actions as per approved Rehabilitation Planning Guideline (Activity Step 8 SOP)', NULL,
 '{"type":"boolean"}',
 '{"acqModeId":[1],"stage":"N11","has_displacement":true}', true, 670,
 'à¤¯à¤¦à¤¿ PAFs à¤•à¤¾ à¤ªà¥à¤¨à¤°à¥à¤µà¤¾à¤¸ à¤¶à¤¾à¤®à¤¿à¤² à¤¹à¥ˆ à¤¤à¥‹ à¤¸à¥à¤µà¥€à¤•à¥ƒà¤¤ à¤ªà¥à¤¨à¤°à¥à¤µà¤¾à¤¸ à¤¯à¥‹à¤œà¤¨à¤¾ à¤¦à¤¿à¤¶à¤¾à¤¨à¤¿à¤°à¥à¤¦à¥‡à¤¶ à¤•à¥‡ à¤…à¤¨à¥à¤¸à¤¾à¤° à¤•à¤¾à¤°à¥à¤°à¤µà¤¾à¤ˆ à¤•à¤°à¥‡à¤‚'),

(gen_random_uuid(), 'RR_COMMITTEE_CONSTITUTION', 'LAND_ACQ_PROPOSAL', 'boolean',
 'For Rehabilitation of PAFs â€” take steps for constitution of R&R Committee as per Activity Step 8.B.6 of SOP', NULL,
 '{"type":"boolean"}',
 '{"acqModeId":[1],"stage":"N11","has_displacement":true}', true, 680,
 'PAFs à¤•à¥‡ à¤ªà¥à¤¨à¤°à¥à¤µà¤¾à¤¸ à¤•à¥‡ à¤²à¤¿à¤ R&R à¤¸à¤®à¤¿à¤¤à¤¿ à¤•à¥‡ à¤—à¤ à¤¨ à¤•à¥‡ à¤²à¤¿à¤ à¤•à¤¦à¤® à¤‰à¤ à¤¾à¤à¤‚'),

-- ============================================================
-- MODULE: LAND_ACQ_PROPOSAL | Mode 2 (Govt Land)
-- ============================================================
(gen_random_uuid(), 'SPECIFIC_PROPOSAL_M2', 'LAND_ACQ_PROPOSAL', 'document',
 'Specific proposal stating purpose, justification and detailing â€” Govt Land Mode', NULL,
 '{"type":"document","multiple":false}',
 '{"acqModeId":[2]}', true, 10,
 'à¤­à¥‚à¤®à¤¿ à¤…à¤§à¤¿à¤—à¥à¤°à¤¹à¤£ à¤•à¥‡ à¤¸à¤‚à¤¬à¤‚à¤§ à¤®à¥‡à¤‚ à¤µà¤¿à¤¶à¤¿à¤·à¥à¤Ÿ à¤ªà¥à¤°à¤¸à¥à¤¤à¤¾à¤µ (à¤¸à¤°à¤•à¤¾à¤°à¥€ à¤­à¥‚à¤®à¤¿)'),

(gen_random_uuid(), 'QUANTUM_LAND_M2', 'LAND_ACQ_PROPOSAL', 'boolean',
 'Whether the Quantum of land to be acquired is within the limit approved in the Project Report â€” Govt Land Mode', NULL,
 '{"type":"boolean"}',
 '{"acqModeId":[2]}', true, 20,
 'à¤•à¥à¤¯à¤¾ à¤…à¤§à¤¿à¤—à¥à¤°à¤¹à¤¿à¤¤ à¤•à¥€ à¤œà¤¾à¤¨à¥‡ à¤µà¤¾à¤²à¥€ à¤­à¥‚à¤®à¤¿ à¤•à¥€ à¤®à¤¾à¤¤à¥à¤°à¤¾ à¤¸à¥à¤µà¥€à¤•à¥ƒà¤¤ à¤¸à¥€à¤®à¤¾ à¤•à¥‡ à¤­à¥€à¤¤à¤° à¤¹à¥ˆ (à¤¸à¤°à¤•à¤¾à¤°à¥€ à¤­à¥‚à¤®à¤¿)'),

(gen_random_uuid(), 'SCHEDULE_LAND_TABULAR_M2', 'LAND_ACQ_PROPOSAL', 'generated_document',
 'Schedule of land in tabular form with land type-wise and mouza-wise abstract â€” Govt Land Mode', NULL,
 '{"type":"generated_document","templateCode":"FORM_XXII","template_code":"FORM_XXII","multiple":false}',
 '{"acqModeId":[2]}', true, 30,
 'à¤­à¥‚à¤®à¤¿ à¤ªà¥à¤°à¤•à¤¾à¤°-à¤µà¤¾à¤° à¤”à¤° à¤®à¥Œà¤œà¤¾-à¤µà¤¾à¤° à¤¸à¤¾à¤°à¤¾à¤‚à¤¶ à¤•à¥‡ à¤¸à¤¾à¤¥ à¤¸à¤¾à¤°à¤£à¥€à¤¬à¤¦à¥à¤§ à¤°à¥‚à¤ª à¤®à¥‡à¤‚ à¤­à¥‚à¤®à¤¿ à¤•à¥€ à¤…à¤¨à¥à¤¸à¥‚à¤šà¥€'),

(gen_random_uuid(), 'CALCULATION_SHEET_SHOWING_COST_1', 'LAND_ACQ_PROPOSAL', 'document',
 'Calculation sheet showing cost of land acquisition â€” Govt Land Mode', NULL,
 '{"type":"document","multiple":false}',
 '{"acqModeId":[2]}', true, 40,
 'à¤­à¥‚à¤®à¤¿ à¤…à¤§à¤¿à¤—à¥à¤°à¤¹à¤£ à¤•à¥€ à¤²à¤¾à¤—à¤¤ à¤¦à¤°à¥à¤¶à¤¾à¤¨à¥‡ à¤µà¤¾à¤²à¥€ à¤—à¤£à¤¨à¤¾ à¤ªà¤¤à¥à¤°à¤• (à¤¸à¤°à¤•à¤¾à¤°à¥€ à¤­à¥‚à¤®à¤¿)'),

(gen_random_uuid(), 'CERT_FIVE_POINT_M2', 'LAND_ACQ_PROPOSAL', 'generated_document',
 'A FIVE-POINT certificate in Form XVI â€” Govt Land Mode', NULL,
 '{"type":"generated_document","templateCode":"FORM_XVI","template_code":"FORM_XVI","multiple":false}',
 '{"acqModeId":[2]}', true, 50,
 'à¤«à¥‰à¤°à¥à¤® XVI à¤®à¥‡à¤‚ à¤ªà¤¾à¤‚à¤š-à¤¬à¤¿à¤‚à¤¦à¥ à¤ªà¥à¤°à¤®à¤¾à¤£ à¤ªà¤¤à¥à¤° (à¤¸à¤°à¤•à¤¾à¤°à¥€ à¤­à¥‚à¤®à¤¿)'),

(gen_random_uuid(), 'DOCS_COMP_FOREST_M2', 'LAND_ACQ_PROPOSAL', 'document',
 'Documents to substantiate the rates of compensation of Forest land â€” Govt Land Mode', NULL,
 '{"type":"document","multiple":true}',
 '{"acqModeId":[2],"has_forest_land":true}', true, 60,
 'à¤µà¤¨ à¤­à¥‚à¤®à¤¿ à¤•à¥‡ à¤®à¥à¤†à¤µà¤œà¥‡ à¤•à¥€ à¤¦à¤°à¥‹à¤‚ à¤•à¥‹ à¤ªà¥à¤°à¤®à¤¾à¤£à¤¿à¤¤ à¤•à¤°à¤¨à¥‡ à¤µà¤¾à¤²à¥‡ à¤¦à¤¸à¥à¤¤à¤¾à¤µà¥‡à¤œ'),

(gen_random_uuid(), 'INVOLVEMENT_EMPLOYMENT_M2', 'LAND_ACQ_PROPOSAL', 'text',
 'Involvement of employment, if any â€” Govt Land Mode', NULL,
 '{"type":"text","placeholder":"e.g. 3 direct, 1 conditional"}',
 '{"acqModeId":[2],"has_employment_involvement":true}', false, 70,
 'à¤°à¥‹à¤œà¤—à¤¾à¤° à¤•à¥€ à¤­à¤¾à¤—à¥€à¤¦à¤¾à¤°à¥€ à¤¯à¤¦à¤¿ à¤•à¥‹à¤ˆ à¤¹à¥‹ (à¤¸à¤°à¤•à¤¾à¤°à¥€ à¤­à¥‚à¤®à¤¿)'),

(gen_random_uuid(), 'AGM_RECOMMENDATION_M2', 'LAND_ACQ_PROPOSAL', 'document',
 'Recommendation of the Area General Manager â€” Govt Land Mode', NULL,
 '{"type":"document","multiple":false}',
 '{"acqModeId":[2]}', true, 80,
 'à¤•à¥à¤·à¥‡à¤¤à¥à¤°à¥€à¤¯ à¤®à¤¹à¤¾à¤ªà¥à¤°à¤¬à¤‚à¤§à¤• à¤•à¥€ à¤¸à¤‚à¤¸à¥à¤¤à¥à¤¤à¤¿/à¤¸à¤¿à¤«à¤¾à¤°à¤¿à¤¶ (à¤¸à¤°à¤•à¤¾à¤°à¥€ à¤­à¥‚à¤®à¤¿)'),

(gen_random_uuid(), 'PAF_REHAB_INVOLVED_M2', 'LAND_ACQ_PROPOSAL', 'boolean',
 'If rehabilitation of PAF is involved â€” Govt Land Mode', NULL,
 '{"type":"boolean","conditionalChecklist":{"module_code":"RR_PACKAGE","trigger":"YES"}}',
 '{"acqModeId":[2]}', false, 90,
 'à¤¯à¤¦à¤¿ PAF à¤•à¤¾ à¤ªà¥à¤¨à¤°à¥à¤µà¤¾à¤¸ à¤¶à¤¾à¤®à¤¿à¤² à¤¹à¥ˆ (à¤¸à¤°à¤•à¤¾à¤°à¥€ à¤­à¥‚à¤®à¤¿)'),

-- ============================================================
-- MODULE: LAND_ACQ_PROPOSAL | Mode 6 (Direct Purchase)
-- ============================================================
(gen_random_uuid(), 'SPECIFIC_PROPOSAL_DP', 'LAND_ACQ_PROPOSAL', 'document',
 'Specific proposal stating purpose, justification and detailing â€” Direct Purchase', NULL,
 '{"type":"document","multiple":false}',
 '{"acqModeId":[6]}', true, 10,
 'à¤­à¥‚à¤®à¤¿ à¤…à¤§à¤¿à¤—à¥à¤°à¤¹à¤£ à¤•à¥‡ à¤¸à¤‚à¤¬à¤‚à¤§ à¤®à¥‡à¤‚ à¤µà¤¿à¤¶à¤¿à¤·à¥à¤Ÿ à¤ªà¥à¤°à¤¸à¥à¤¤à¤¾à¤µ (à¤ªà¥à¤°à¤¤à¥à¤¯à¤•à¥à¤· à¤–à¤°à¥€à¤¦)'),

(gen_random_uuid(), 'QUANTUM_OF_LAND_DP', 'LAND_ACQ_PROPOSAL', 'boolean',
 'Whether Quantum of land is within the limit approved in the Project Report â€” Direct Purchase', NULL,
 '{"type":"boolean"}',
 '{"acqModeId":[6]}', true, 20,
 'à¤•à¥à¤¯à¤¾ à¤…à¤§à¤¿à¤—à¥à¤°à¤¹à¤¿à¤¤ à¤•à¥€ à¤œà¤¾à¤¨à¥‡ à¤µà¤¾à¤²à¥€ à¤­à¥‚à¤®à¤¿ à¤•à¥€ à¤®à¤¾à¤¤à¥à¤°à¤¾ à¤¸à¥à¤µà¥€à¤•à¥ƒà¤¤ à¤¸à¥€à¤®à¤¾ à¤•à¥‡ à¤­à¥€à¤¤à¤° à¤¹à¥ˆ (à¤ªà¥à¤°à¤¤à¥à¤¯à¤•à¥à¤· à¤–à¤°à¥€à¤¦)'),

(gen_random_uuid(), 'SCHEDULE_LAND_TABULAR_DP', 'LAND_ACQ_PROPOSAL', 'generated_document',
 'Schedule of land in tabular form â€” Direct Purchase', NULL,
 '{"type":"generated_document","templateCode":"FORM_XXII","template_code":"FORM_XXII","multiple":false}',
 '{"acqModeId":[6]}', true, 30,
 'à¤¸à¤¾à¤°à¤£à¥€à¤¬à¤¦à¥à¤§ à¤°à¥‚à¤ª à¤®à¥‡à¤‚ à¤­à¥‚à¤®à¤¿ à¤•à¥€ à¤…à¤¨à¥à¤¸à¥‚à¤šà¥€ (à¤ªà¥à¤°à¤¤à¥à¤¯à¤•à¥à¤· à¤–à¤°à¥€à¤¦)'),

(gen_random_uuid(), 'FORM_VII_DP', 'LAND_ACQ_PROPOSAL', 'generated_document',
 'Copy of reconciliation certificate (Form VII) â€” Direct Purchase', NULL,
 '{"type":"generated_document","templateCode":"FORM_VII","template_code":"FORM_VII","multiple":false}',
 '{"acqModeId":[6]}', true, 40,
 'à¤¸à¤®à¤¾à¤§à¤¾à¤¨ à¤ªà¥à¤°à¤®à¤¾à¤£ à¤ªà¤¤à¥à¤° à¤•à¥€ à¤ªà¥à¤°à¤¤à¤¿ (Form VII) - à¤ªà¥à¤°à¤¤à¥à¤¯à¤•à¥à¤· à¤–à¤°à¥€à¤¦'),

(gen_random_uuid(), 'FOREST_CLEARANCE_DP', 'LAND_ACQ_PROPOSAL', 'document',
 'Copy of Forest Clearance, if obtained â€” Direct Purchase', NULL,
 '{"type":"document","multiple":false}',
 '{"acqModeId":[6],"has_forest_land":true}', true, 50,
 'à¤µà¤¨ à¤®à¤‚à¤œà¥‚à¤°à¥€ à¤•à¥€ à¤ªà¥à¤°à¤¤à¤¿ à¤¯à¤¦à¤¿ à¤ªà¥à¤°à¤¾à¤ªà¥à¤¤ à¤¹à¥‹ (à¤ªà¥à¤°à¤¤à¥à¤¯à¤•à¥à¤· à¤–à¤°à¥€à¤¦)'),

(gen_random_uuid(), 'FORM_XVI_DP', 'LAND_ACQ_PROPOSAL', 'generated_document',
 'A FIVE-POINT certificate in Form XVI â€” Direct Purchase', NULL,
 '{"type":"generated_document","templateCode":"FORM_XVI","template_code":"FORM_XVI","multiple":false}',
 '{"acqModeId":[6]}', true, 60,
 'à¤«à¥‰à¤°à¥à¤® XVI à¤®à¥‡à¤‚ à¤ªà¤¾à¤‚à¤š-à¤¬à¤¿à¤‚à¤¦à¥ à¤ªà¥à¤°à¤®à¤¾à¤£ à¤ªà¤¤à¥à¤° (à¤ªà¥à¤°à¤¤à¥à¤¯à¤•à¥à¤· à¤–à¤°à¥€à¤¦)'),

(gen_random_uuid(), 'PR_SCHEME_PAGES_DP', 'LAND_ACQ_PROPOSAL', 'document',
 'Copies of relevant pages of approved PR/Scheme/Conceptual Report of the Mine/Project â€” Direct Purchase', NULL,
 '{"type":"document","multiple":true}',
 '{"acqModeId":[6]}', true, 70,
 'à¤¸à¥à¤µà¥€à¤•à¥ƒà¤¤ à¤ªà¥€à¤†à¤°/à¤¯à¥‹à¤œà¤¨à¤¾ à¤•à¥‡ à¤ªà¥à¤°à¤¾à¤¸à¤‚à¤—à¤¿à¤• à¤ªà¥ƒà¤·à¥à¤ à¥‹à¤‚ à¤•à¥€ à¤ªà¥à¤°à¤¤à¤¿à¤¯à¤¾à¤‚ (à¤ªà¥à¤°à¤¤à¥à¤¯à¤•à¥à¤· à¤–à¤°à¥€à¤¦)'),

(gen_random_uuid(), 'TECHNO_ECONOMIC_DP', 'LAND_ACQ_PROPOSAL', 'document',
 'Techno-Economic Report â€” Direct Purchase', NULL,
 '{"type":"document","multiple":false}',
 '{"acqModeId":[6]}', true, 80,
 'à¤¤à¤•à¤¨à¥€à¤•à¥€-à¤†à¤°à¥à¤¥à¤¿à¤• à¤°à¤¿à¤ªà¥‹à¤°à¥à¤Ÿ (à¤ªà¥à¤°à¤¤à¥à¤¯à¤•à¥à¤· à¤–à¤°à¥€à¤¦)'),

(gen_random_uuid(), 'COMPENSATION_GOVT_DP', 'LAND_ACQ_PROPOSAL', 'document',
 'Documents to substantiate the rates of compensation of Government land/Patta Land â€” Direct Purchase', NULL,
 '{"type":"document","multiple":true}',
 '{"acqModeId":[6],"has_govt_land":true}', true, 90,
 'à¤¸à¤°à¤•à¤¾à¤°à¥€ à¤­à¥‚à¤®à¤¿/à¤ªà¤Ÿà¥à¤Ÿà¤¾ à¤­à¥‚à¤®à¤¿ à¤•à¥‡ à¤®à¥à¤†à¤µà¤œà¥‡ à¤•à¥€ à¤¦à¤°à¥‹à¤‚ à¤•à¥‹ à¤ªà¥à¤°à¤®à¤¾à¤£à¤¿à¤¤ à¤•à¤°à¤¨à¥‡ à¤µà¤¾à¤²à¥‡ à¤¦à¤¸à¥à¤¤à¤¾à¤µà¥‡à¤œ'),

(gen_random_uuid(), 'COMPENSATION_FOREST_DP', 'LAND_ACQ_PROPOSAL', 'document',
 'Documents to substantiate the rates of compensation of Forest land â€” Direct Purchase', NULL,
 '{"type":"document","multiple":true}',
 '{"acqModeId":[6],"has_forest_land":true}', true, 100,
 'à¤µà¤¨ à¤­à¥‚à¤®à¤¿ à¤•à¥‡ à¤®à¥à¤†à¤µà¤œà¥‡ à¤•à¥€ à¤¦à¤°à¥‹à¤‚ à¤•à¥‹ à¤ªà¥à¤°à¤®à¤¾à¤£à¤¿à¤¤ à¤•à¤°à¤¨à¥‡ à¤µà¤¾à¤²à¥‡ à¤¦à¤¸à¥à¤¤à¤¾à¤µà¥‡à¤œ (à¤ªà¥à¤°à¤¤à¥à¤¯à¤•à¥à¤· à¤–à¤°à¥€à¤¦)'),

(gen_random_uuid(), 'COMPENSATION_TENANCY_DP', 'LAND_ACQ_PROPOSAL', 'document',
 'Documents to substantiate the rates of compensation of Tenancy land â€” Direct Purchase', NULL,
 '{"type":"document","multiple":true}',
 '{"acqModeId":[6],"has_tenancy_land":true}', true, 110,
 'à¤•à¤¿à¤°à¤¾à¤¯à¥‡à¤¦à¤¾à¤°à¥€ à¤­à¥‚à¤®à¤¿ à¤•à¥‡ à¤®à¥à¤†à¤µà¤œà¥‡ à¤•à¥€ à¤¦à¤°à¥‹à¤‚ à¤•à¥‹ à¤ªà¥à¤°à¤®à¤¾à¤£à¤¿à¤¤ à¤•à¤°à¤¨à¥‡ à¤µà¤¾à¤²à¥‡ à¤¦à¤¸à¥à¤¤à¤¾à¤µà¥‡à¤œ'),

(gen_random_uuid(), 'MARKET_PRICE_TENANCY_DP', 'LAND_ACQ_PROPOSAL', 'document',
 'Copy of Government notified market price of tenancy lands for registration cost calculation â€” Direct Purchase', NULL,
 '{"type":"document","multiple":false}',
 '{"acqModeId":[6],"has_tenancy_land":true}', true, 120,
 'à¤ªà¤‚à¤œà¥€à¤•à¤°à¤£ à¤²à¤¾à¤—à¤¤ à¤—à¤£à¤¨à¤¾ à¤•à¥‡ à¤²à¤¿à¤ à¤•à¤¿à¤°à¤¾à¤¯à¥‡à¤¦à¤¾à¤°à¥€ à¤­à¥‚à¤®à¤¿ à¤•à¥‡ à¤¸à¤°à¤•à¤¾à¤°à¥€ à¤…à¤§à¤¿à¤¸à¥‚à¤šà¤¿à¤¤ à¤¬à¤¾à¤œà¤¾à¤° à¤®à¥‚à¤²à¥à¤¯ à¤•à¥€ à¤ªà¥à¤°à¤¤à¤¿'),

(gen_random_uuid(), 'MINUTES_OF_MEETING_DP', 'LAND_ACQ_PROPOSAL', 'document',
 'Minutes of meeting with landowners for their acceptance of the proposed rate â€” Direct Purchase', NULL,
 '{"type":"document","multiple":false}',
 '{"acqModeId":[6],"has_formal_negotiation":true}', true, 130,
 'à¤­à¥‚à¤¸à¥à¤µà¤¾à¤®à¤¿à¤¯à¥‹à¤‚ à¤•à¥‡ à¤¸à¤¾à¤¥ à¤¬à¥ˆà¤ à¤• à¤•à¤¾ à¤•à¤¾à¤°à¥à¤¯à¤µà¥ƒà¤¤à¥à¤¤ (à¤ªà¥à¤°à¤¤à¥à¤¯à¤•à¥à¤· à¤–à¤°à¥€à¤¦)'),

(gen_random_uuid(), 'COPY_APPROVAL_DISTRICT_AUTHORITY', 'LAND_ACQ_PROPOSAL', 'document',
 'Copy of approval of District Authority for purchase of Tribal Land', NULL,
 '{"type":"document","multiple":false}',
 '{"acqModeId":[6],"has_tribal_land":true}', true, 140,
 'à¤†à¤¦à¤¿à¤µà¤¾à¤¸à¥€ à¤­à¥‚à¤®à¤¿ à¤•à¥€ à¤–à¤°à¥€à¤¦ à¤•à¥‡ à¤²à¤¿à¤ à¤œà¤¿à¤²à¤¾ à¤ªà¥à¤°à¤¾à¤§à¤¿à¤•à¤°à¤£ à¤•à¥‡ à¤…à¤¨à¥à¤®à¥‹à¤¦à¤¨ à¤•à¥€ à¤ªà¥à¤°à¤¤à¤¿'),

(gen_random_uuid(), 'DEBOTTAR_LAND_APPROVAL_DP', 'LAND_ACQ_PROPOSAL', 'document',
 'Copy of approval of Board of Revenue for purchase of Debottar Land â€” Direct Purchase', NULL,
 '{"type":"document","multiple":false}',
 '{"acqModeId":[6],"has_debottar_land":true}', true, 150,
 'à¤¦à¥‡à¤¬à¥‹à¤¤à¥à¤¤à¤° à¤­à¥‚à¤®à¤¿ à¤•à¥€ à¤–à¤°à¥€à¤¦ à¤•à¥‡ à¤²à¤¿à¤ à¤°à¤¾à¤œà¤¸à¥à¤µ à¤¬à¥‹à¤°à¥à¤¡ à¤•à¥‡ à¤…à¤¨à¥à¤®à¥‹à¤¦à¤¨ à¤•à¥€ à¤ªà¥à¤°à¤¤à¤¿'),

(gen_random_uuid(), 'FORM_XXII_DP', 'LAND_ACQ_PROPOSAL', 'generated_document',
 'Form-XXII â€” Proposal for purchase of Tenancy land / transfer of Government or Forest Land', NULL,
 '{"type":"generated_document","templateCode":"FORM_XXII","template_code":"FORM_XXII","multiple":false}',
 '{"acqModeId":[6]}', true, 160,
 'à¤«à¥‰à¤°à¥à¤®-XXII â€” à¤•à¤¿à¤°à¤¾à¤¯à¥‡à¤¦à¤¾à¤°à¥€ à¤­à¥‚à¤®à¤¿ à¤•à¥€ à¤–à¤°à¥€à¤¦ / à¤¸à¤°à¤•à¤¾à¤°à¥€ à¤¯à¤¾ à¤µà¤¨ à¤­à¥‚à¤®à¤¿ à¤•à¥‡ à¤¹à¤¸à¥à¤¤à¤¾à¤‚à¤¤à¤°à¤£ à¤•à¤¾ à¤ªà¥à¤°à¤¸à¥à¤¤à¤¾à¤µ'),

(gen_random_uuid(), 'EMPLOYMENT_INVOLVEMENT_DP', 'LAND_ACQ_PROPOSAL', 'text',
 'Involvement of employment, if any (Specify exact number of employments and conditional employments) â€” Direct Purchase', NULL,
 '{"type":"text","placeholder":"e.g. 2 direct, 1 conditional"}',
 '{"acqModeId":[6],"has_employment_involvement":true}', false, 170,
 'à¤°à¥‹à¤œà¤—à¤¾à¤° à¤•à¥€ à¤­à¤¾à¤—à¥€à¤¦à¤¾à¤°à¥€ à¤¯à¤¦à¤¿ à¤•à¥‹à¤ˆ à¤¹à¥‹ (à¤ªà¥à¤°à¤¤à¥à¤¯à¤•à¥à¤· à¤–à¤°à¥€à¤¦)'),

(gen_random_uuid(), 'LAND_CELL_REPORT_DP', 'LAND_ACQ_PROPOSAL', 'document',
 'Report on examination of the proposal by Area Land Cell Committee â€” Direct Purchase', NULL,
 '{"type":"document","multiple":false}',
 '{"acqModeId":[6]}', true, 180,
 'à¤•à¥à¤·à¥‡à¤¤à¥à¤°à¥€à¤¯ à¤­à¥‚à¤®à¤¿ à¤¸à¥‡à¤² à¤¸à¤®à¤¿à¤¤à¤¿ à¤¦à¥à¤µà¤¾à¤°à¤¾ à¤ªà¥à¤°à¤¸à¥à¤¤à¤¾à¤µ à¤•à¥€ à¤œà¤¾à¤‚à¤š à¤ªà¤° à¤°à¤¿à¤ªà¥‹à¤°à¥à¤Ÿ (à¤ªà¥à¤°à¤¤à¥à¤¯à¤•à¥à¤· à¤–à¤°à¥€à¤¦)'),

(gen_random_uuid(), 'AGM_RECOMMENDATION_DP', 'LAND_ACQ_PROPOSAL', 'document',
 'Recommendation of the Area General Manager â€” Direct Purchase', NULL,
 '{"type":"document","multiple":false}',
 '{"acqModeId":[6]}', true, 190,
 'à¤•à¥à¤·à¥‡à¤¤à¥à¤°à¥€à¤¯ à¤®à¤¹à¤¾à¤ªà¥à¤°à¤¬à¤‚à¤§à¤• à¤•à¥€ à¤¸à¤‚à¤¸à¥à¤¤à¥à¤¤à¤¿/à¤¸à¤¿à¤«à¤¾à¤°à¤¿à¤¶ (à¤ªà¥à¤°à¤¤à¥à¤¯à¤•à¥à¤· à¤–à¤°à¥€à¤¦)'),

-- ============================================================
-- MODULE: LAND_POSSESSION
-- ============================================================
(gen_random_uuid(), 'GAZETTE_ORDERS_SEC9_11_POS', 'LAND_POSSESSION', 'document',
 'Copies of Sanction Orders published in Gazette of India under Sections 9 and 11 of CBA (A&D) Act 1957', NULL,
 '{"type":"document","multiple":true}',
 NULL, true, 10,
 'à¤¸à¥€à¤¬à¥€à¤ à¤…à¤§à¤¿à¤¨à¤¿à¤¯à¤® 1957 à¤•à¥€ à¤§à¤¾à¤°à¤¾ 9 à¤”à¤° 11 à¤•à¥‡ à¤¤à¤¹à¤¤ à¤°à¤¾à¤œà¤ªà¤¤à¥à¤° à¤®à¥‡à¤‚ à¤ªà¥à¤°à¤•à¤¾à¤¶à¤¿à¤¤ à¤¸à¥à¤µà¥€à¤•à¥ƒà¤¤à¤¿ à¤†à¤¦à¥‡à¤¶à¥‹à¤‚ à¤•à¥€ à¤ªà¥à¤°à¤¤à¤¿à¤¯à¤¾à¤‚'),

(gen_random_uuid(), 'MOUZA_LANDTYPE_ABSTRACT_POS', 'LAND_POSSESSION', 'document',
 'Mouza-wise and land type-wise abstract of land proposed for possession', NULL,
 '{"type":"document","multiple":false}',
 NULL, true, 20,
 'à¤œà¤¿à¤¸ à¤­à¥‚à¤®à¤¿ à¤•à¤¾ à¤•à¤¬à¥à¤œà¤¾ à¤ªà¥à¤°à¤¸à¥à¤¤à¤¾à¤µà¤¿à¤¤ à¤¹à¥ˆ à¤‰à¤¸à¤•à¤¾ à¤®à¥Œà¤œà¤¾ à¤µà¤¾à¤° à¤”à¤° à¤­à¥‚à¤®à¤¿ à¤ªà¥à¤°à¤•à¤¾à¤° à¤µà¤¾à¤° à¤¸à¤¾à¤°à¤¾à¤‚à¤¶'),

(gen_random_uuid(), 'CERT_RECONCILIATION_POS', 'LAND_POSSESSION', 'generated_document',
 'Copy of Reconciliation Certificate (Form VII) â€” Possession', NULL,
 '{"type":"generated_document","templateCode":"FORM_VII","template_code":"FORM_VII","multiple":false}',
 NULL, true, 30,
 'à¤¸à¤®à¤¾à¤§à¤¾à¤¨ à¤ªà¥à¤°à¤®à¤¾à¤£ à¤ªà¤¤à¥à¤° (Form VII) à¤•à¥€ à¤ªà¥à¤°à¤¤à¤¿ (à¤•à¤¬à¥à¤œà¤¾)'),

(gen_random_uuid(), 'COPIES_PR_SCHEME_POS', 'LAND_POSSESSION', 'document',
 'Copies of relevant pages of approved PR / Scheme / Conceptual Report â€” Possession', NULL,
 '{"type":"document","multiple":true}',
 NULL, true, 40,
 'à¤¸à¥à¤µà¥€à¤•à¥ƒà¤¤ à¤ªà¥€à¤†à¤°/à¤¯à¥‹à¤œà¤¨à¤¾/à¤µà¥ˆà¤šà¤¾à¤°à¤¿à¤• à¤°à¤¿à¤ªà¥‹à¤°à¥à¤Ÿ à¤•à¥‡ à¤ªà¥à¤°à¤¾à¤¸à¤‚à¤—à¤¿à¤• à¤ªà¥ƒà¤·à¥à¤ à¥‹à¤‚ à¤•à¥€ à¤ªà¥à¤°à¤¤à¤¿à¤¯à¤¾à¤‚ (à¤•à¤¬à¥à¤œà¤¾)'),

(gen_random_uuid(), 'TECHNO_ECONOMIC_POS', 'LAND_POSSESSION', 'document',
 'Techno-Economic Report showing total financial involvement for Tenancy, Govt, and Forest land possession', NULL,
 '{"type":"document","multiple":false}',
 NULL, true, 50,
 'à¤¤à¤•à¤¨à¥€à¤•à¥€-à¤†à¤°à¥à¤¥à¤¿à¤• à¤°à¤¿à¤ªà¥‹à¤°à¥à¤Ÿ à¤œà¤¿à¤¸à¤®à¥‡à¤‚ à¤ªà¥à¤°à¤¸à¥à¤¤à¤¾à¤µà¤¿à¤¤ à¤•à¤¬à¥à¤œà¥‡ à¤•à¥‡ à¤²à¤¿à¤ à¤•à¥à¤² à¤µà¤¿à¤¤à¥à¤¤à¥€à¤¯ à¤­à¤¾à¤—à¥€à¤¦à¤¾à¤°à¥€ à¤¦à¤¿à¤–à¤¾à¤ˆ à¤—à¤ˆ à¤¹à¥‹'),

(gen_random_uuid(), 'CALCULATION_RATES_POS', 'LAND_POSSESSION', 'document',
 'Calculation showing details of rates of compensation for each category of land â€” Possession', NULL,
 '{"type":"document","multiple":false}',
 NULL, true, 60,
 'à¤­à¥‚à¤®à¤¿ à¤•à¥€ à¤ªà¥à¤°à¤¤à¥à¤¯à¥‡à¤• à¤¶à¥à¤°à¥‡à¤£à¥€ à¤•à¥‡ à¤²à¤¿à¤ à¤®à¥à¤†à¤µà¤œà¥‡ à¤•à¥€ à¤¦à¤°à¥‹à¤‚ à¤•à¤¾ à¤µà¤¿à¤µà¤°à¤£ à¤¦à¤°à¥à¤¶à¤¾à¤¨à¥‡ à¤µà¤¾à¤²à¥€ à¤—à¤£à¤¨à¤¾'),

(gen_random_uuid(), 'DOCS_COMP_FOREST_POS', 'LAND_POSSESSION', 'document',
 'Documents to substantiate compensation rates of Forest land â€” Possession', NULL,
 '{"type":"document","multiple":true}',
 '{"has_forest_land":true}', true, 70,
 'à¤µà¤¨ à¤­à¥‚à¤®à¤¿ à¤•à¥‡ à¤®à¥à¤†à¤µà¤œà¥‡ à¤•à¥€ à¤¦à¤°à¥‹à¤‚ à¤•à¥‹ à¤ªà¥à¤°à¤®à¤¾à¤£à¤¿à¤¤ à¤•à¤°à¤¨à¥‡ à¤µà¤¾à¤²à¥‡ à¤¦à¤¸à¥à¤¤à¤¾à¤µà¥‡à¤œ (à¤•à¤¬à¥à¤œà¤¾)'),

(gen_random_uuid(), 'COMPLAINTS_RESOLVED_POS', 'LAND_POSSESSION', 'boolean',
 'Whether complaints, if any, have been resolved by the Area GM and the land schedule modified accordingly', NULL,
 '{"type":"boolean"}',
 NULL, true, 80,
 'à¤•à¥à¤¯à¤¾ à¤¶à¤¿à¤•à¤¾à¤¯à¤¤à¥‹à¤‚ à¤•à¤¾ à¤¸à¤®à¤¾à¤§à¤¾à¤¨ à¤•à¥à¤·à¥‡à¤¤à¥à¤°à¥€à¤¯ à¤®à¤¹à¤¾à¤ªà¥à¤°à¤¬à¤‚à¤§à¤• à¤¦à¥à¤µà¤¾à¤°à¤¾ à¤•à¤¿à¤¯à¤¾ à¤—à¤¯à¤¾ à¤¹à¥ˆ'),

(gen_random_uuid(), 'FORM_VIII_POS', 'LAND_POSSESSION', 'generated_document',
 'Form VIII â€” kept published on ECL official website for at least three weeks (provide publication date)', NULL,
 '{"type":"generated_document","templateCode":"FORM_VIII","template_code":"FORM_VIII","multiple":false}',
 NULL, true, 90,
 'à¤«à¥‰à¤°à¥à¤® VIII â€” à¤ˆà¤¸à¥€à¤à¤² à¤µà¥‡à¤¬à¤¸à¤¾à¤‡à¤Ÿ à¤ªà¤° à¤•à¤® à¤¸à¥‡ à¤•à¤® à¤¤à¥€à¤¨ à¤¸à¤ªà¥à¤¤à¤¾à¤¹ à¤¤à¤• à¤ªà¥à¤°à¤•à¤¾à¤¶à¤¿à¤¤ à¤°à¤–à¤¾ à¤—à¤¯à¤¾'),

(gen_random_uuid(), 'INVOLVEMENT_EMPLOYMENT_POS', 'LAND_POSSESSION', 'text',
 'Involvement of employment, if any (Specify number of employments and conditional employments) â€” Possession', NULL,
 '{"type":"text","placeholder":"e.g. 3 direct, 2 conditional"}',
 '{"has_employment_involvement":true}', false, 100,
 'à¤°à¥‹à¤œà¤—à¤¾à¤° à¤•à¥€ à¤­à¤¾à¤—à¥€à¤¦à¤¾à¤°à¥€ à¤¯à¤¦à¤¿ à¤•à¥‹à¤ˆ à¤¹à¥‹ (à¤•à¤¬à¥à¤œà¤¾)'),

(gen_random_uuid(), 'LAND_CELL_REPORT_POS', 'LAND_POSSESSION', 'document',
 'Report on examination of the proposal by the Area Land Cell Committee and recommendation â€” Possession', NULL,
 '{"type":"document","multiple":false}',
 NULL, true, 110,
 'à¤•à¥à¤·à¥‡à¤¤à¥à¤°à¥€à¤¯ à¤­à¥‚à¤®à¤¿ à¤¸à¥‡à¤² à¤¸à¤®à¤¿à¤¤à¤¿ à¤¦à¥à¤µà¤¾à¤°à¤¾ à¤ªà¥à¤°à¤¸à¥à¤¤à¤¾à¤µ à¤•à¥€ à¤œà¤¾à¤‚à¤š à¤ªà¤° à¤°à¤¿à¤ªà¥‹à¤°à¥à¤Ÿ (à¤•à¤¬à¥à¤œà¤¾)'),

(gen_random_uuid(), 'JUSTIFICATION_HEAD_MINE_POS', 'LAND_POSSESSION', 'document',
 'Justification and recommendation by the Head of Mine/Project â€” Possession', NULL,
 '{"type":"document","multiple":false}',
 NULL, true, 120,
 'à¤–à¤¦à¤¾à¤¨/à¤ªà¤°à¤¿à¤¯à¥‹à¤œà¤¨à¤¾ à¤•à¥‡ à¤ªà¥à¤°à¤®à¥à¤– à¤¦à¥à¤µà¤¾à¤°à¤¾ à¤”à¤šà¤¿à¤¤à¥à¤¯ à¤”à¤° à¤¸à¤¿à¤«à¤¾à¤°à¤¿à¤¶'),

(gen_random_uuid(), 'AGM_RECOMMENDATION_POS', 'LAND_POSSESSION', 'document',
 'Recommendation of the Area General Manager â€” Possession', NULL,
 '{"type":"document","multiple":false}',
 NULL, true, 130,
 'à¤•à¥à¤·à¥‡à¤¤à¥à¤°à¥€à¤¯ à¤®à¤¹à¤¾à¤ªà¥à¤°à¤¬à¤‚à¤§à¤• à¤•à¥€ à¤¸à¤‚à¤¸à¥à¤¤à¥à¤¤à¤¿/à¤¸à¤¿à¤«à¤¾à¤°à¤¿à¤¶ (à¤•à¤¬à¥à¤œà¤¾)'),

-- ============================================================
-- MODULE: RR_PACKAGE
-- ============================================================
(gen_random_uuid(), 'RR_PLANNING_GUIDELINE', 'RR_PACKAGE', 'boolean',
 'Whether Rehabilitation Planning has been done according to the approved Rehabilitation Planning Guideline', NULL,
 '{"type":"boolean"}',
 NULL, true, 10,
 'à¤•à¥à¤¯à¤¾ à¤ªà¥à¤¨à¤°à¥à¤µà¤¾à¤¸ à¤¯à¥‹à¤œà¤¨à¤¾ à¤¸à¥à¤µà¥€à¤•à¥ƒà¤¤ à¤ªà¥à¤¨à¤°à¥à¤µà¤¾à¤¸ à¤¯à¥‹à¤œà¤¨à¤¾ à¤¦à¤¿à¤¶à¤¾à¤¨à¤¿à¤°à¥à¤¦à¥‡à¤¶à¥‹à¤‚ à¤•à¥‡ à¤…à¤¨à¥à¤¸à¤¾à¤° à¤•à¥€ à¤—à¤ˆ à¤¹à¥ˆ'),

(gen_random_uuid(), 'RR_SCHEME_NO_GUIDELINE', 'RR_PACKAGE', 'document',
 'In case of non-availability of approved Rehabilitation Planning Guideline â€” Scheme for Rehabilitation prepared and recommended by Area GM', NULL,
 '{"type":"document","multiple":false}',
 NULL, false, 20,
 'à¤¸à¥à¤µà¥€à¤•à¥ƒà¤¤ à¤ªà¥à¤¨à¤°à¥à¤µà¤¾à¤¸ à¤¯à¥‹à¤œà¤¨à¤¾ à¤¦à¤¿à¤¶à¤¾à¤¨à¤¿à¤°à¥à¤¦à¥‡à¤¶ à¤•à¥€ à¤…à¤¨à¥à¤ªà¤²à¤¬à¥à¤§à¤¤à¤¾ à¤•à¥‡ à¤®à¤¾à¤®à¤²à¥‡ à¤®à¥‡à¤‚ à¤ªà¥à¤¨à¤°à¥à¤µà¤¾à¤¸ à¤¯à¥‹à¤œà¤¨à¤¾'),

(gen_random_uuid(), 'SOCIO_ECONOMIC_STUDY', 'RR_PACKAGE', 'boolean',
 'Whether a Socio-economic study for collection of baseline data has been conducted', NULL,
 '{"type":"boolean"}',
 NULL, true, 30,
 'à¤•à¥à¤¯à¤¾ à¤†à¤§à¤¾à¤°à¤­à¥‚à¤¤ à¤¡à¥‡à¤Ÿà¤¾ à¤¸à¤‚à¤—à¥à¤°à¤¹ à¤•à¥‡ à¤²à¤¿à¤ à¤¸à¤¾à¤®à¤¾à¤œà¤¿à¤•-à¤†à¤°à¥à¤¥à¤¿à¤• à¤…à¤§à¥à¤¯à¤¯à¤¨ à¤†à¤¯à¥‹à¤œà¤¿à¤¤ à¤•à¤¿à¤¯à¤¾ à¤—à¤¯à¤¾ à¤¹à¥ˆ'),

(gen_random_uuid(), 'AGENCY_SOCIO_STUDY', 'RR_PACKAGE', 'document',
 'Details of the Agency/Committee framed by GM which carried out the socio-economic study', NULL,
 '{"type":"document","multiple":false}',
 NULL, true, 40,
 'à¤œà¥€à¤à¤® à¤¦à¥à¤µà¤¾à¤°à¤¾ à¤—à¤ à¤¿à¤¤ à¤à¤œà¥‡à¤‚à¤¸à¥€/à¤¸à¤®à¤¿à¤¤à¤¿ à¤•à¤¾ à¤µà¤¿à¤µà¤°à¤£ à¤œà¤¿à¤¸à¤¨à¥‡ à¤¸à¤¾à¤®à¤¾à¤œà¤¿à¤•-à¤†à¤°à¥à¤¥à¤¿à¤• à¤…à¤§à¥à¤¯à¤¯à¤¨ à¤•à¤¿à¤¯à¤¾ à¤¹à¥ˆ'),

(gen_random_uuid(), 'CENSUS_PAFS_TIMELY', 'RR_PACKAGE', 'boolean',
 'Whether census for identification of PAFs has been carried out within time stipulated in Activity Step 8.B of SOP', NULL,
 '{"type":"boolean","conditionalText":true}',
 NULL, true, 50,
 'à¤•à¥à¤¯à¤¾ PAFs à¤•à¥€ à¤ªà¤¹à¤šà¤¾à¤¨ à¤•à¥‡ à¤²à¤¿à¤ à¤œà¤¨à¤—à¤£à¤¨à¤¾ à¤à¤¸à¤“à¤ªà¥€ à¤•à¥‡ à¤—à¤¤à¤¿à¤µà¤¿à¤§à¤¿ à¤šà¤°à¤£ 8.B à¤®à¥‡à¤‚ à¤¨à¤¿à¤°à¥à¤§à¤¾à¤°à¤¿à¤¤ à¤¸à¤®à¤¯ à¤•à¥‡ à¤­à¥€à¤¤à¤° à¤•à¥€ à¤—à¤ˆ à¤¹à¥ˆ'),

(gen_random_uuid(), 'COUNT_PAFS_REHABILITATE', 'RR_PACKAGE', 'text',
 'Number of Project Affected Families (PAFs) to be rehabilitated as per census report', NULL,
 '{"type":"text","placeholder":"Enter number"}',
 NULL, true, 60,
 'à¤œà¤¨à¤—à¤£à¤¨à¤¾ à¤°à¤¿à¤ªà¥‹à¤°à¥à¤Ÿ à¤•à¥‡ à¤…à¤¨à¥à¤¸à¤¾à¤° à¤ªà¥à¤¨à¤°à¥à¤µà¤¾à¤¸à¤¿à¤¤ à¤•à¤¿à¤ à¤œà¤¾à¤¨à¥‡ à¤µà¤¾à¤²à¥‡ PAFs à¤•à¥€ à¤¸à¤‚à¤–à¥à¤¯à¤¾'),

(gen_random_uuid(), 'COUNT_PAFS_LUMPSUM', 'RR_PACKAGE', 'text',
 'Number of PAFs to be shifted with payment of one-time lump sum monetary compensation as per CIL R&R Policy', NULL,
 '{"type":"text","placeholder":"Enter number"}',
 NULL, true, 70,
 'à¤¸à¥€à¤†à¤ˆà¤à¤² à¤†à¤° à¤à¤‚à¤¡ à¤†à¤° à¤¨à¥€à¤¤à¤¿ à¤•à¥‡ à¤…à¤¨à¥à¤¸à¤¾à¤° à¤à¤•à¤®à¥à¤¶à¥à¤¤ à¤®à¥Œà¤¦à¥à¤°à¤¿à¤• à¤®à¥à¤†à¤µà¤œà¥‡ à¤•à¥‡ à¤¸à¤¾à¤¥ à¤¸à¥à¤¥à¤¾à¤¨à¤¾à¤‚à¤¤à¤°à¤¿à¤¤ à¤¹à¥‹à¤¨à¥‡ à¤µà¤¾à¤²à¥‡ PAFs à¤•à¥€ à¤¸à¤‚à¤–à¥à¤¯à¤¾'),

(gen_random_uuid(), 'COUNT_PAFS_RESETTLED', 'RR_PACKAGE', 'text',
 'Number of PAFs to be resettled at any rehabilitation site', NULL,
 '{"type":"text","placeholder":"Enter number"}',
 NULL, true, 80,
 'à¤•à¤¿à¤¸à¥€ à¤­à¥€ à¤ªà¥à¤¨à¤°à¥à¤µà¤¾à¤¸ à¤¸à¥à¤¥à¤² à¤ªà¤° à¤¬à¤¸à¤¾à¤ à¤œà¤¾à¤¨à¥‡ à¤µà¤¾à¤²à¥‡ PAFs à¤•à¥€ à¤¸à¤‚à¤–à¥à¤¯à¤¾'),

(gen_random_uuid(), 'RESETTLEMENT_SITE_DETAILS', 'RR_PACKAGE', 'text',
 'If PAFs are to be resettled at a rehabilitation site â€” provide location, total land area, plot area per PAF', NULL,
 '{"type":"text","multiline":true,"placeholder":"Location:\nTotal land area:\nPlot area per PAF:"}',
 NULL, false, 90,
 'à¤¯à¤¦à¤¿ PAFs à¤•à¥‹ à¤ªà¥à¤¨à¤°à¥à¤µà¤¾à¤¸ à¤¸à¥à¤¥à¤² à¤ªà¤° à¤¬à¤¸à¤¾à¤¯à¤¾ à¤œà¤¾à¤¨à¤¾ à¤¹à¥ˆ à¤¤à¥‹ à¤¸à¥à¤¥à¤¾à¤¨, à¤•à¥à¤² à¤­à¥‚à¤®à¤¿ à¤•à¥à¤·à¥‡à¤¤à¥à¤°, à¤ªà¥à¤°à¤¤à¤¿ PAF à¤ªà¥à¤²à¥‰à¤Ÿ à¤•à¥à¤·à¥‡à¤¤à¥à¤° à¤•à¤¾ à¤µà¤¿à¤µà¤°à¤£'),

(gen_random_uuid(), 'REHAB_LAND_IN_SCHEME', 'RR_PACKAGE', 'boolean',
 'Whether the land to be acquired for the Rehabilitation Site is within Provision of approved Scheme/Project report', NULL,
 '{"type":"boolean","conditionalText":true}',
 NULL, true, 100,
 'à¤•à¥à¤¯à¤¾ à¤ªà¥à¤¨à¤°à¥à¤µà¤¾à¤¸ à¤¸à¥à¤¥à¤² à¤•à¥‡ à¤²à¤¿à¤ à¤…à¤§à¤¿à¤—à¥à¤°à¤¹à¤¿à¤¤ à¤•à¥€ à¤œà¤¾à¤¨à¥‡ à¤µà¤¾à¤²à¥€ à¤­à¥‚à¤®à¤¿ à¤¸à¥à¤µà¥€à¤•à¥ƒà¤¤ à¤¯à¥‹à¤œà¤¨à¤¾/à¤ªà¤°à¤¿à¤¯à¥‹à¤œà¤¨à¤¾ à¤°à¤¿à¤ªà¥‹à¤°à¥à¤Ÿ à¤•à¥‡ à¤ªà¥à¤°à¤¾à¤µà¤§à¤¾à¤¨ à¤•à¥‡ à¤­à¥€à¤¤à¤° à¤¹à¥ˆ'),

(gen_random_uuid(), 'STATUS_REHAB_LAND_ACQ', 'RR_PACKAGE', 'text',
 'Status of acquisition of the land required for the rehabilitation site', NULL,
 '{"type":"text","placeholder":"e.g. Acquired / In Progress / Pending"}',
 NULL, true, 110,
 'à¤ªà¥à¤¨à¤°à¥à¤µà¤¾à¤¸ à¤¸à¥à¤¥à¤² à¤•à¥‡ à¤²à¤¿à¤ à¤†à¤µà¤¶à¥à¤¯à¤• à¤­à¥‚à¤®à¤¿ à¤•à¥‡ à¤…à¤§à¤¿à¤—à¥à¤°à¤¹à¤£ à¤•à¥€ à¤¸à¥à¤¥à¤¿à¤¤à¤¿'),

(gen_random_uuid(), 'STATUS_REHAB_LAND_POS', 'RR_PACKAGE', 'text',
 'Status of possession of the land required for the rehabilitation site', NULL,
 '{"type":"text","placeholder":"e.g. Possessed / Pending"}',
 NULL, true, 120,
 'à¤ªà¥à¤¨à¤°à¥à¤µà¤¾à¤¸ à¤¸à¥à¤¥à¤² à¤•à¥‡ à¤²à¤¿à¤ à¤†à¤µà¤¶à¥à¤¯à¤• à¤­à¥‚à¤®à¤¿ à¤•à¥‡ à¤•à¤¬à¥à¤œà¥‡ à¤•à¥€ à¤¸à¥à¤¥à¤¿à¤¤à¤¿'),

(gen_random_uuid(), 'VILLAGES_TO_BE_SHIFTED', 'RR_PACKAGE', 'text',
 'Names and locations of villages to be shifted', NULL,
 '{"type":"text","multiline":true,"placeholder":"Village 1: Name, Location\nVillage 2: Name, Location"}',
 NULL, true, 130,
 'à¤µà¤¿à¤¸à¥à¤¥à¤¾à¤ªà¤¿à¤¤ à¤•à¤¿à¤ à¤œà¤¾à¤¨à¥‡ à¤µà¤¾à¤²à¥‡ à¤—à¤¾à¤‚à¤µà¥‹à¤‚ à¤•à¥‡ à¤¨à¤¾à¤® à¤”à¤° à¤¸à¥à¤¥à¤¾à¤¨'),

(gen_random_uuid(), 'DATE_CENSUS_REPORT', 'RR_PACKAGE', 'text',
 'Date of submission of the report of census', NULL,
 '{"type":"text","placeholder":"DD/MM/YYYY"}',
 NULL, true, 140,
 'à¤œà¤¨à¤—à¤£à¤¨à¤¾ à¤•à¥€ à¤°à¤¿à¤ªà¥‹à¤°à¥à¤Ÿ à¤œà¤®à¤¾ à¤•à¤°à¤¨à¥‡ à¤•à¥€ à¤¤à¤¿à¤¥à¤¿'),

(gen_random_uuid(), 'DISPLACED_FAMILIES_IN_SCHEME', 'RR_PACKAGE', 'boolean',
 'Whether identified Displaced Families are covered under the provision of approved Scheme/Project report', NULL,
 '{"type":"boolean","conditionalText":true}',
 NULL, true, 150,
 'à¤•à¥à¤¯à¤¾ à¤ªà¤¹à¤šà¤¾à¤¨à¥‡ à¤—à¤ à¤µà¤¿à¤¸à¥à¤¥à¤¾à¤ªà¤¿à¤¤ à¤ªà¤°à¤¿à¤µà¤¾à¤° à¤¸à¥à¤µà¥€à¤•à¥ƒà¤¤ à¤¯à¥‹à¤œà¤¨à¤¾/à¤ªà¤°à¤¿à¤¯à¥‹à¤œà¤¨à¤¾ à¤°à¤¿à¤ªà¥‹à¤°à¥à¤Ÿ à¤•à¥‡ à¤ªà¥à¤°à¤¾à¤µà¤§à¤¾à¤¨ à¤•à¥‡ à¤…à¤‚à¤¤à¤°à¥à¤—à¤¤ à¤†à¤¤à¥‡ à¤¹à¥ˆà¤‚'),

(gen_random_uuid(), 'IDENTITY_CARDS_ISSUED', 'RR_PACKAGE', 'boolean',
 'Whether identity cards have been issued to the displaced families', NULL,
 '{"type":"boolean","conditionalText":true}',
 NULL, true, 160,
 'à¤•à¥à¤¯à¤¾ à¤µà¤¿à¤¸à¥à¤¥à¤¾à¤ªà¤¿à¤¤ à¤ªà¤°à¤¿à¤µà¤¾à¤°à¥‹à¤‚ à¤•à¥‹ à¤ªà¤¹à¤šà¤¾à¤¨ à¤ªà¤¤à¥à¤° à¤œà¤¾à¤°à¥€ à¤•à¤¿à¤ à¤—à¤ à¤¹à¥ˆà¤‚'),

(gen_random_uuid(), 'RR_COMMITTEE_CONSTITUTED', 'RR_PACKAGE', 'boolean',
 'Whether the Resettlement & Rehabilitation Committee has been constituted', NULL,
 '{"type":"boolean","conditionalText":true}',
 NULL, true, 170,
 'à¤•à¥à¤¯à¤¾ à¤ªà¥à¤¨à¤°à¥à¤µà¤¾à¤¸ à¤à¤µà¤‚ à¤ªà¥à¤¨à¤°à¥à¤µà¥à¤¯à¤µà¤¸à¥à¤¥à¤¾à¤ªà¤¨ à¤¸à¤®à¤¿à¤¤à¤¿ à¤•à¤¾ à¤—à¤ à¤¨ à¤•à¤¿à¤¯à¤¾ à¤—à¤¯à¤¾ à¤¹à¥ˆ'),

(gen_random_uuid(), 'ESTIMATED_LUMPSUM_AMOUNT', 'RR_PACKAGE', 'text',
 'Estimated amount to be paid on account of one-time lump sum monetary compensation, if any', NULL,
 '{"type":"text","placeholder":"â‚¹ Amount in Lakhs"}',
 NULL, false, 180,
 'à¤à¤•à¤®à¥à¤¶à¥à¤¤ à¤®à¥Œà¤¦à¥à¤°à¤¿à¤• à¤®à¥à¤†à¤µà¤œà¥‡ à¤•à¥‡ à¤–à¤¾à¤¤à¥‡ à¤®à¥‡à¤‚ à¤­à¥à¤—à¤¤à¤¾à¤¨ à¤•à¥€ à¤œà¤¾à¤¨à¥‡ à¤µà¤¾à¤²à¥€ à¤…à¤¨à¥à¤®à¤¾à¤¨à¤¿à¤¤ à¤°à¤¾à¤¶à¤¿'),

(gen_random_uuid(), 'HOUSES_STRUCTURES_VALUATION', 'RR_PACKAGE', 'document',
 'Documents showing number of Houses, Structures and assets in villages with specifications and valuation', NULL,
 '{"type":"document","multiple":true}',
 NULL, true, 190,
 'à¤—à¤¾à¤‚à¤µà¥‹à¤‚ à¤®à¥‡à¤‚ à¤˜à¤°à¥‹à¤‚, à¤¸à¤‚à¤°à¤šà¤¨à¤¾à¤“à¤‚ à¤”à¤° à¤¸à¤‚à¤ªà¤¤à¥à¤¤à¤¿à¤¯à¥‹à¤‚ à¤•à¥€ à¤¸à¤‚à¤–à¥à¤¯à¤¾ à¤¦à¤°à¥à¤¶à¤¾à¤¨à¥‡ à¤µà¤¾à¤²à¥‡ à¤¦à¤¸à¥à¤¤à¤¾à¤µà¥‡à¤œ'),

(gen_random_uuid(), 'VALUATION_METHOD_LA_ACT', 'RR_PACKAGE', 'boolean',
 'Whether valuation of assets has been done as per standard valuation method of the L.A. Act of concerned State Govt', NULL,
 '{"type":"boolean","conditionalText":true}',
 NULL, true, 200,
 'à¤•à¥à¤¯à¤¾ à¤ªà¤°à¤¿à¤¸à¤‚à¤ªà¤¤à¥à¤¤à¤¿à¤¯à¥‹à¤‚ à¤•à¤¾ à¤®à¥‚à¤²à¥à¤¯à¤¾à¤‚à¤•à¤¨ à¤¸à¤‚à¤¬à¤‚à¤§à¤¿à¤¤ à¤°à¤¾à¤œà¥à¤¯ à¤¸à¤°à¤•à¤¾à¤° à¤•à¥‡ à¤à¤².à¤. à¤à¤•à¥à¤Ÿ à¤•à¥€ à¤®à¤¾à¤¨à¤• à¤®à¥‚à¤²à¥à¤¯à¤¾à¤‚à¤•à¤¨ à¤ªà¤¦à¥à¤§à¤¤à¤¿ à¤•à¥‡ à¤…à¤¨à¥à¤¸à¤¾à¤° à¤•à¤¿à¤¯à¤¾ à¤—à¤¯à¤¾ à¤¹à¥ˆ'),

(gen_random_uuid(), 'SOR_RATE_CHARTS', 'RR_PACKAGE', 'document',
 'Document furnishing authentic/approved SOR/Rate charts considered for valuation of assets', NULL,
 '{"type":"document","multiple":true}',
 NULL, true, 210,
 'à¤ªà¥à¤°à¤¾à¤®à¤¾à¤£à¤¿à¤•/à¤¸à¥à¤µà¥€à¤•à¥ƒà¤¤ SOR/à¤¦à¤° à¤šà¤¾à¤°à¥à¤Ÿ à¤†à¤¦à¤¿ à¤ªà¥à¤°à¤¸à¥à¤¤à¥à¤¤ à¤•à¤°à¤¨à¥‡ à¤µà¤¾à¤²à¤¾ à¤¦à¤¸à¥à¤¤à¤¾à¤µà¥‡à¤œ'),

(gen_random_uuid(), 'TOTAL_CAPITAL_RR', 'RR_PACKAGE', 'text',
 'Total capital involvement for R&R of PAFs along with calculation details', NULL,
 '{"type":"text","multiline":true,"placeholder":"Total amount in Lakhs with calculation basis"}',
 NULL, true, 220,
 'PAFs à¤•à¥‡ à¤†à¤° à¤à¤‚à¤¡ à¤†à¤° à¤•à¥‡ à¤²à¤¿à¤ à¤•à¥à¤² à¤ªà¥‚à¤‚à¤œà¥€ à¤­à¤¾à¤—à¥€à¤¦à¤¾à¤°à¥€ à¤”à¤° à¤—à¤£à¤¨à¤¾ à¤µà¤¿à¤µà¤°à¤£'),

(gen_random_uuid(), 'REVENUE_PLAN_REHAB_SITE', 'RR_PACKAGE', 'document',
 'A revenue plan showing existing villages to be shifted and proposed rehabilitation site in different colours', NULL,
 '{"type":"document","multiple":false}',
 NULL, true, 230,
 'à¤®à¥Œà¤œà¥‚à¤¦à¤¾ à¤—à¤¾à¤‚à¤µà¥‹à¤‚ à¤”à¤° à¤ªà¥à¤°à¤¸à¥à¤¤à¤¾à¤µà¤¿à¤¤ à¤ªà¥à¤¨à¤°à¥à¤µà¤¾à¤¸ à¤¸à¥à¤¥à¤² à¤•à¥‹ à¤¦à¤°à¥à¤¶à¤¾à¤¨à¥‡ à¤µà¤¾à¤²à¤¾ à¤°à¤¾à¤œà¤¸à¥à¤µ à¤®à¤¾à¤¨à¤šà¤¿à¤¤à¥à¤°'),

(gen_random_uuid(), 'CONSENT_DISPLACED_FAMILIES', 'RR_PACKAGE', 'document',
 'Consent of displaced families for proposed rehabilitation (Attach minutes of meeting/agreement)', NULL,
 '{"type":"document","multiple":true}',
 NULL, true, 240,
 'à¤ªà¥à¤°à¤¸à¥à¤¤à¤¾à¤µà¤¿à¤¤ à¤ªà¥à¤¨à¤°à¥à¤µà¤¾à¤¸ à¤•à¥‡ à¤²à¤¿à¤ à¤µà¤¿à¤¸à¥à¤¥à¤¾à¤ªà¤¿à¤¤ à¤ªà¤°à¤¿à¤µà¤¾à¤°à¥‹à¤‚ à¤•à¥€ à¤¸à¤¹à¤®à¤¤à¤¿'),

(gen_random_uuid(), 'CONSENT_LANDOWNERS_REHAB_SITE', 'RR_PACKAGE', 'document',
 'Consent of landowners/villagers at and around the rehabilitation site (Attach minutes/agreement)', NULL,
 '{"type":"document","multiple":true}',
 NULL, true, 250,
 'à¤ªà¥à¤¨à¤°à¥à¤µà¤¾à¤¸ à¤¸à¥à¤¥à¤² à¤•à¥‡ à¤†à¤¸à¤ªà¤¾à¤¸ à¤•à¥‡ à¤­à¥‚à¤¸à¥à¤µà¤¾à¤®à¤¿à¤¯à¥‹à¤‚/à¤—à¥à¤°à¤¾à¤®à¥€à¤£à¥‹à¤‚ à¤•à¥€ à¤¸à¤¹à¤®à¤¤à¤¿'),

(gen_random_uuid(), 'COPIES_APPROVED_PR_RR', 'RR_PACKAGE', 'document',
 'Copies of relevant pages of approved Project Report/Scheme along with order of approval by competent authority', NULL,
 '{"type":"document","multiple":true}',
 NULL, true, 260,
 'à¤¸à¤•à¥à¤·à¤® à¤ªà¥à¤°à¤¾à¤§à¤¿à¤•à¤¾à¤°à¥€ à¤•à¥‡ à¤…à¤¨à¥à¤®à¥‹à¤¦à¤¨ à¤†à¤¦à¥‡à¤¶ à¤•à¥‡ à¤¸à¤¾à¤¥ à¤¸à¥à¤µà¥€à¤•à¥ƒà¤¤ à¤ªà¤°à¤¿à¤¯à¥‹à¤œà¤¨à¤¾ à¤°à¤¿à¤ªà¥‹à¤°à¥à¤Ÿ/à¤¯à¥‹à¤œà¤¨à¤¾ à¤•à¥‡ à¤ªà¥à¤°à¤¾à¤¸à¤‚à¤—à¤¿à¤• à¤ªà¥ƒà¤·à¥à¤ à¥‹à¤‚ à¤•à¥€ à¤ªà¥à¤°à¤¤à¤¿à¤¯à¤¾à¤‚'),

(gen_random_uuid(), 'DEVIATION_RR_POLICY', 'RR_PACKAGE', 'text',
 'Details of deviation from CIL R&R Policy provisions and relaxation sought, if any', NULL,
 '{"type":"text","multiline":true,"placeholder":"Describe deviation and relaxation requested"}',
 NULL, false, 270,
 'à¤¸à¥€à¤†à¤ˆà¤à¤² à¤•à¥€ à¤†à¤° à¤à¤‚à¤¡ à¤†à¤° à¤¨à¥€à¤¤à¤¿ à¤•à¥‡ à¤ªà¥à¤°à¤¾à¤µà¤§à¤¾à¤¨ à¤¸à¥‡ à¤µà¤¿à¤šà¤²à¤¨ à¤”à¤° à¤®à¤¾à¤‚à¤—à¥€ à¤—à¤ˆ à¤›à¥‚à¤Ÿ à¤•à¤¾ à¤µà¤¿à¤µà¤°à¤£'),

(gen_random_uuid(), 'RANIGANJ_MASTER_PLAN', 'RR_PACKAGE', 'boolean',
 'Whether full or part of land is included in Raniganj Master Plan or any Central/State Govt approved plan', NULL,
 '{"type":"boolean","conditionalRadio":["Whether it has been communicated to consonant authority?"]}',
 NULL, false, 280,
 'à¤•à¥à¤¯à¤¾ à¤ªà¥‚à¤°à¥à¤£ à¤¯à¤¾ à¤†à¤‚à¤¶à¤¿à¤• à¤­à¥‚à¤®à¤¿ à¤°à¤¾à¤¨à¥€à¤—à¤‚à¤œ à¤®à¤¾à¤¸à¥à¤Ÿà¤° à¤ªà¥à¤²à¤¾à¤¨ à¤¯à¤¾ à¤•à¥‡à¤‚à¤¦à¥à¤°/à¤°à¤¾à¤œà¥à¤¯ à¤¸à¤°à¤•à¤¾à¤° à¤¦à¥à¤µà¤¾à¤°à¤¾ à¤…à¤¨à¥à¤®à¥‹à¤¦à¤¿à¤¤ à¤•à¤¿à¤¸à¥€ à¤à¤¸à¥‡ à¤ªà¥à¤²à¤¾à¤¨ à¤®à¥‡à¤‚ à¤¶à¤¾à¤®à¤¿à¤² à¤¹à¥ˆ'),

-- ============================================================
-- MODULE: COMPENSATION
-- ============================================================
(gen_random_uuid(), 'GAZETTE_ORDERS_SEC9_11_COMP', 'COMPENSATION', 'document',
 'Copies of Sanction Orders published in Gazette of India under Sections 9 and 11 of CBA (A&D) Act 1957 â€” Compensation', NULL,
 '{"type":"document","multiple":true}',
 NULL, true, 10,
 'à¤¸à¥€à¤¬à¥€à¤ à¤…à¤§à¤¿à¤¨à¤¿à¤¯à¤® 1957 à¤•à¥€ à¤§à¤¾à¤°à¤¾ 9 à¤”à¤° 11 à¤•à¥‡ à¤¤à¤¹à¤¤ à¤°à¤¾à¤œà¤ªà¤¤à¥à¤° à¤®à¥‡à¤‚ à¤ªà¥à¤°à¤•à¤¾à¤¶à¤¿à¤¤ à¤¸à¥à¤µà¥€à¤•à¥ƒà¤¤à¤¿ à¤†à¤¦à¥‡à¤¶à¥‹à¤‚ à¤•à¥€ à¤ªà¥à¤°à¤¤à¤¿à¤¯à¤¾à¤‚'),

(gen_random_uuid(), 'COPIES_PR_SCHEME_COMP', 'COMPENSATION', 'document',
 'Copies of approved PR / Scheme of the Mine/Project â€” Compensation', NULL,
 '{"type":"document","multiple":true}',
 NULL, true, 20,
 'à¤–à¤¦à¤¾à¤¨/à¤ªà¤°à¤¿à¤¯à¥‹à¤œà¤¨à¤¾ à¤•à¥€ à¤¸à¥à¤µà¥€à¤•à¥ƒà¤¤ à¤ªà¥€à¤†à¤°/à¤¯à¥‹à¤œà¤¨à¤¾ à¤•à¥€ à¤ªà¥à¤°à¤¤à¤¿à¤¯à¤¾à¤‚'),

(gen_random_uuid(), 'APPROVAL_POSSESSION_PLOTS', 'COMPENSATION', 'document',
 'Approval of competent Authority for taking possession of specific plots', NULL,
 '{"type":"document","multiple":false}',
 NULL, true, 30,
 'à¤µà¤¿à¤¶à¤¿à¤·à¥à¤Ÿ à¤­à¥‚à¤–à¤‚à¤¡à¥‹à¤‚ à¤ªà¤° à¤•à¤¬à¥à¤œà¤¾ à¤²à¥‡à¤¨à¥‡ à¤•à¥‡ à¤²à¤¿à¤ à¤¸à¤•à¥à¤·à¤® à¤ªà¥à¤°à¤¾à¤§à¤¿à¤•à¤¾à¤°à¥€ à¤•à¤¾ à¤…à¤¨à¥à¤®à¥‹à¤¦à¤¨'),

(gen_random_uuid(), 'COMPENSATION_PAYROLL_1A', 'COMPENSATION', 'generated_document',
 'Compensation Payroll in Standard Form 1A', NULL,
 '{"type":"generated_document","templateCode":"FORM_1A","template_code":"FORM_1A","multiple":false}',
 NULL, true, 40,
 'à¤®à¤¾à¤¨à¤• à¤«à¥‰à¤°à¥à¤® 1A à¤®à¥‡à¤‚ à¤®à¥à¤†à¤µà¤œà¤¾ à¤ªà¥‡à¤°à¥‹à¤²'),

(gen_random_uuid(), 'COMPENSATION_PAYROLL_1B', 'COMPENSATION', 'generated_document',
 'Compensation Payroll in Standard Form 1B', NULL,
 '{"type":"generated_document","templateCode":"FORM_1B","template_code":"FORM_1B","multiple":false}',
 NULL, true, 50,
 'à¤®à¤¾à¤¨à¤• à¤«à¥‰à¤°à¥à¤® 1B à¤®à¥‡à¤‚ à¤®à¥à¤†à¤µà¤œà¤¾ à¤ªà¥‡à¤°à¥‹à¤²'),

(gen_random_uuid(), 'MINUTES_VILLAGERS_COMP', 'COMPENSATION', 'document',
 'Minutes of meetings/Agreements with villagers â€” particularly important if Compensation Payroll prepared under CBA (A&D) Section 14(1)', NULL,
 '{"type":"document","multiple":true}',
 NULL, true, 60,
 'à¤—à¥à¤°à¤¾à¤®à¥€à¤£à¥‹à¤‚ à¤•à¥‡ à¤¸à¤¾à¤¥ à¤¬à¥ˆà¤ à¤•à¥‹à¤‚ à¤•à¤¾ à¤•à¤¾à¤°à¥à¤¯à¤µà¥ƒà¤¤à¥à¤¤/à¤¸à¤®à¤à¥Œà¤¤à¥‡'),

(gen_random_uuid(), 'CERT_RECONCILIATION_COMP', 'COMPENSATION', 'generated_document',
 'Copies of reconciliation certificates (Form VII) â€” Compensation', NULL,
 '{"type":"generated_document","templateCode":"FORM_VII","template_code":"FORM_VII","multiple":true}',
 NULL, true, 70,
 'à¤¸à¤®à¤¾à¤§à¤¾à¤¨ à¤ªà¥à¤°à¤®à¤¾à¤£ à¤ªà¤¤à¥à¤°à¥‹à¤‚ (FORM-VII) à¤•à¥€ à¤ªà¥à¤°à¤¤à¤¿à¤¯à¤¾à¤‚ (à¤®à¥à¤†à¤µà¤œà¤¾)'),

(gen_random_uuid(), 'STATUTE_RFCTLARR_RRPOLICY', 'COMPENSATION', 'select',
 'Details of schedules and provisions of RFCTLARR Act 2013 or any other statute under which Compensation Payroll has been prepared', NULL,
 '{"type":"select","options":["LARR ACT","RRPOLICY"]}',
 NULL, true, 80,
 'RFCTLARR à¤…à¤§à¤¿à¤¨à¤¿à¤¯à¤® 2013 à¤•à¥€ à¤…à¤¨à¥à¤¸à¥‚à¤šà¤¿à¤¯à¥‹à¤‚ à¤”à¤° à¤ªà¥à¤°à¤¾à¤µà¤§à¤¾à¤¨à¥‹à¤‚ à¤¯à¤¾ à¤•à¤¿à¤¸à¥€ à¤…à¤¨à¥à¤¯ à¤ªà¥à¤°à¤šà¤²à¤¿à¤¤ à¤•à¤¼à¤¾à¤¨à¥‚à¤¨ à¤•à¤¾ à¤µà¤¿à¤µà¤°à¤£'),

(gen_random_uuid(), 'AGM_LAND_CELL_REC_COMP', 'COMPENSATION', 'boolean',
 'Recommendation of Area Land Cell and Area General Manager â€” Compensation', NULL,
 '{"type":"boolean"}',
 NULL, true, 90,
 'à¤•à¥à¤·à¥‡à¤¤à¥à¤°à¥€à¤¯ à¤­à¥‚à¤®à¤¿ à¤¸à¥‡à¤² à¤”à¤° à¤•à¥à¤·à¥‡à¤¤à¥à¤°à¥€à¤¯ à¤®à¤¹à¤¾à¤ªà¥à¤°à¤¬à¤‚à¤§à¤• à¤•à¥€ à¤¸à¤¿à¤«à¤¾à¤°à¤¿à¤¶ (à¤®à¥à¤†à¤µà¤œà¤¾)'),

-- ============================================================
-- MODULE: ASSET_RR
-- ============================================================
(gen_random_uuid(), 'COPIES_PR_SCHEME_ARR', 'ASSET_RR', 'document',
 'Copies of approved PR/Scheme of Mine/Project showing provisions for shifting of the village in question', NULL,
 '{"type":"document","multiple":true}',
 NULL, true, 10,
 'à¤¸à¤‚à¤¬à¤‚à¤§à¤¿à¤¤ à¤—à¤¾à¤‚à¤µ à¤•à¥‡ à¤¸à¥à¤¥à¤¾à¤¨à¤¾à¤‚à¤¤à¤°à¤£ à¤•à¥‡ à¤ªà¥à¤°à¤¾à¤µà¤§à¤¾à¤¨à¥‹à¤‚ à¤•à¥‹ à¤¦à¤°à¥à¤¶à¤¾à¤¤à¥‡ à¤¹à¥à¤ à¤–à¤¦à¤¾à¤¨/à¤ªà¤°à¤¿à¤¯à¥‹à¤œà¤¨à¤¾ à¤•à¥€ à¤¸à¥à¤µà¥€à¤•à¥ƒà¤¤ à¤ªà¥€à¤†à¤°/à¤¯à¥‹à¤œà¤¨à¤¾ à¤•à¥€ à¤ªà¥à¤°à¤¤à¤¿à¤¯à¤¾à¤‚'),

(gen_random_uuid(), 'APPROVAL_POSSESSION_ARR', 'ASSET_RR', 'document',
 'Approval of competent Authority for taking possession of specific plots â€” Asset R&R', NULL,
 '{"type":"document","multiple":false}',
 NULL, true, 20,
 'à¤µà¤¿à¤¶à¤¿à¤·à¥à¤Ÿ à¤­à¥‚à¤–à¤‚à¤¡à¥‹à¤‚ à¤ªà¤° à¤•à¤¬à¥à¤œà¤¾ à¤²à¥‡à¤¨à¥‡ à¤•à¥‡ à¤²à¤¿à¤ à¤¸à¤•à¥à¤·à¤® à¤ªà¥à¤°à¤¾à¤§à¤¿à¤•à¤¾à¤°à¥€ à¤•à¤¾ à¤…à¤¨à¥à¤®à¥‹à¤¦à¤¨ (Asset R&R)'),

(gen_random_uuid(), 'COMPENSATION_PAYROLL_ARR', 'ASSET_RR', 'document',
 'The Compensation Payroll bill â€” Asset R&R', NULL,
 '{"type":"document","multiple":false}',
 NULL, true, 30,
 'à¤®à¥à¤†à¤µà¤œà¤¾ à¤ªà¥‡à¤°à¥‹à¤² à¤¬à¤¿à¤² (Asset R&R)'),

(gen_random_uuid(), 'RR_PACKAGE_APPROVAL', 'ASSET_RR', 'document',
 'Copy of approval of R&R package with all details and relaxation of R&R Policy/Norms', NULL,
 '{"type":"document","multiple":false}',
 NULL, true, 40,
 'à¤¸à¤­à¥€ à¤µà¤¿à¤µà¤°à¤£à¥‹à¤‚ à¤•à¥‡ à¤¸à¤¾à¤¥ R&R à¤ªà¥ˆà¤•à¥‡à¤œ à¤•à¥‡ à¤…à¤¨à¥à¤®à¥‹à¤¦à¤¨ à¤•à¥€ à¤ªà¥à¤°à¤¤à¤¿'),

(gen_random_uuid(), 'DEMOGRAPHIC_SURVEY_ARR', 'ASSET_RR', 'document',
 'Copy of the details of demographic survey done in the village', NULL,
 '{"type":"document","multiple":false}',
 NULL, true, 50,
 'à¤—à¤¾à¤‚à¤µ à¤®à¥‡à¤‚ à¤•à¤¿à¤ à¤—à¤ à¤œà¤¨à¤¸à¤¾à¤‚à¤–à¥à¤¯à¤¿à¤•à¥€à¤¯ à¤¸à¤°à¥à¤µà¥‡à¤•à¥à¤·à¤£ à¤•à¥‡ à¤µà¤¿à¤µà¤°à¤£ à¤•à¥€ à¤ªà¥à¤°à¤¤à¤¿'),

(gen_random_uuid(), 'STRUCTURE_MEASUREMENTS', 'ASSET_RR', 'document',
 'Details of measurement and calculations related to structures', NULL,
 '{"type":"document","multiple":true}',
 NULL, true, 60,
 'à¤¸à¤‚à¤°à¤šà¤¨à¤¾à¤“à¤‚ à¤¸à¥‡ à¤¸à¤‚à¤¬à¤‚à¤§à¤¿à¤¤ à¤®à¤¾à¤ª à¤”à¤° à¤—à¤£à¤¨à¤¾ à¤•à¤¾ à¤µà¤¿à¤µà¤°à¤£'),

(gen_random_uuid(), 'STATEMENT_LUMPSUM_PAFS', 'ASSET_RR', 'document',
 'A statement regarding PAFs who received One-time Lump sum amount in lieu of alternative house site â€” confirming no plot allotted', NULL,
 '{"type":"document","multiple":false}',
 NULL, false, 70,
 'à¤‰à¤¨ PAFs à¤•à¥‡ à¤¸à¤‚à¤¬à¤‚à¤§ à¤®à¥‡à¤‚ à¤¬à¤¯à¤¾à¤¨ à¤œà¤¿à¤¨à¥à¤¹à¥‹à¤‚à¤¨à¥‡ à¤à¤•à¤®à¥à¤¶à¥à¤¤ à¤°à¤¾à¤¶à¤¿ à¤ªà¥à¤°à¤¾à¤ªà¥à¤¤ à¤•à¥€ à¤¹à¥ˆ'),

(gen_random_uuid(), 'SYSTEM_IMPROVEMENT_NORM', 'ASSET_RR', 'boolean',
 'Whether System Improvement Norm regarding rehabilitation of PAFs have been followed', NULL,
 '{"type":"boolean","conditionalText":true}',
 NULL, true, 80,
 'à¤•à¥à¤¯à¤¾ PAFS à¤•à¥‡ à¤ªà¥à¤¨à¤°à¥à¤µà¤¾à¤¸ à¤•à¥‡ à¤¸à¤‚à¤¬à¤‚à¤§ à¤®à¥‡à¤‚ à¤¸à¤¿à¤¸à¥à¤Ÿà¤® à¤‡à¤®à¥à¤ªà¥à¤°à¥‚à¤µà¤®à¥‡à¤‚à¤Ÿ à¤¨à¥‰à¤°à¥à¤® à¤•à¤¾ à¤ªà¤¾à¤²à¤¨ à¤•à¤¿à¤¯à¤¾ à¤—à¤¯à¤¾ à¤¹à¥ˆ'),

(gen_random_uuid(), 'RFCTLARR_AFFIDAVITS_ARR', 'ASSET_RR', 'boolean',
 'In case some recipients are entitled to RFCTLARR Act 2013 benefits â€” whether related PAFs submitted required Affidavits u/s 108 and signed Agreement with ECL u/s 14(1) CBA Act', NULL,
 '{"type":"boolean","conditionalUpload":{"trigger":"YES","label":"Upload Affidavits and Agreements"}}',
 '{"is_rfctlarr":true}', false, 90,
 'à¤•à¥à¤¯à¤¾ RFCTLARR à¤…à¤§à¤¿à¤¨à¤¿à¤¯à¤® à¤•à¥‡ à¤¤à¤¹à¤¤ à¤²à¤¾à¤­ à¤ªà¤¾à¤¨à¥‡ à¤µà¤¾à¤²à¥‡ PAFs à¤¨à¥‡ à¤¶à¤ªà¤¥ à¤ªà¤¤à¥à¤° à¤ªà¥à¤°à¤¸à¥à¤¤à¥à¤¤ à¤•à¤¿à¤ à¤¹à¥ˆà¤‚'),

(gen_random_uuid(), 'AGM_LAND_CELL_REC_ARR', 'ASSET_RR', 'boolean',
 'Recommendation of Area Land Cell and Area General Manager â€” Asset R&R', NULL,
 '{"type":"boolean"}',
 NULL, true, 100,
 'à¤•à¥à¤·à¥‡à¤¤à¥à¤°à¥€à¤¯ à¤­à¥‚à¤®à¤¿ à¤¸à¥‡à¤² à¤”à¤° à¤•à¥à¤·à¥‡à¤¤à¥à¤°à¥€à¤¯ à¤®à¤¹à¤¾à¤ªà¥à¤°à¤¬à¤‚à¤§à¤• à¤•à¥€ à¤¸à¤¿à¤«à¤¾à¤°à¤¿à¤¶ (Asset R&R)'),

-- ============================================================
-- MODULE: EMPLOYMENT_PROP
-- ============================================================
(gen_random_uuid(), 'BIO_DATA_NOMINEE', 'EMPLOYMENT_PROP', 'document',
 'Bio-data of the Nominee as per Activity Step 4.B', NULL,
 '{"type":"document","multiple":false}',
 NULL, true, 10,
 'à¤—à¤¤à¤¿à¤µà¤¿à¤§à¤¿ à¤šà¤°à¤£ 4.B à¤•à¥‡ à¤…à¤¨à¥à¤¸à¤¾à¤° à¤¨à¤¾à¤®à¤¾à¤‚à¤•à¤¿à¤¤ à¤µà¥à¤¯à¤•à¥à¤¤à¤¿ à¤•à¤¾ à¤¬à¤¾à¤¯à¥‹à¤¡à¤¾à¤Ÿà¤¾'),

(gen_random_uuid(), 'FORM_A_EMP', 'EMPLOYMENT_PROP', 'generated_document',
 'Duly signed and properly filled-up FORM-A', NULL,
 '{"type":"generated_document","templateCode":"FORM_A","template_code":"FORM_A","multiple":false}',
 NULL, true, 20,
 'à¤µà¤¿à¤§à¤¿à¤µà¤¤ à¤¹à¤¸à¥à¤¤à¤¾à¤•à¥à¤·à¤°à¤¿à¤¤ à¤”à¤° à¤ à¥€à¤• à¤¸à¥‡ à¤­à¤°à¤¾ à¤¹à¥à¤† FORM-A'),

(gen_random_uuid(), 'FORM_B_EMP', 'EMPLOYMENT_PROP', 'generated_document',
 'Duly signed and properly filled-up FORM-B', NULL,
 '{"type":"generated_document","templateCode":"FORM_B","template_code":"FORM_B","multiple":false}',
 NULL, true, 30,
 'à¤µà¤¿à¤§à¤¿à¤µà¤¤ à¤¹à¤¸à¥à¤¤à¤¾à¤•à¥à¤·à¤°à¤¿à¤¤ à¤”à¤° à¤ à¥€à¤• à¤¸à¥‡ à¤­à¤°à¤¾ à¤¹à¥à¤† FORM-B'),

(gen_random_uuid(), 'FORM_C_EMP', 'EMPLOYMENT_PROP', 'generated_document',
 'Duly signed and properly filled-up FORM-C', NULL,
 '{"type":"generated_document","templateCode":"FORM_C","template_code":"FORM_C","multiple":false}',
 NULL, true, 40,
 'à¤µà¤¿à¤§à¤¿à¤µà¤¤ à¤¹à¤¸à¥à¤¤à¤¾à¤•à¥à¤·à¤°à¤¿à¤¤ à¤”à¤° à¤ à¥€à¤• à¤¸à¥‡ à¤­à¤°à¤¾ à¤¹à¥à¤† FORM-C'),

(gen_random_uuid(), 'FORM_VI_EMP', 'EMPLOYMENT_PROP', 'generated_document',
 'Self-declaration Certificate (FORM-VI)', NULL,
 '{"type":"generated_document","templateCode":"FORM_VI","template_code":"FORM_VI","multiple":false}',
 NULL, true, 50,
 'à¤¸à¥à¤µ-à¤˜à¥‹à¤·à¤£à¤¾ à¤ªà¥à¤°à¤®à¤¾à¤£ à¤ªà¤¤à¥à¤° (FORM-VI)'),

(gen_random_uuid(), 'STANDARD_ATTESTATION_EMP', 'EMPLOYMENT_PROP', 'document',
 'Standard Attestation Form', NULL,
 '{"type":"document","multiple":false}',
 NULL, true, 60,
 'à¤®à¤¾à¤¨à¤• à¤¸à¤¾à¤•à¥à¤·à¥à¤¯à¤¾à¤‚à¤•à¤¨ à¤ªà¥à¤°à¤ªà¤¤à¥à¤°'),

(gen_random_uuid(), 'ECL_WEBSITE_PUBLICATION', 'EMPLOYMENT_PROP', 'document',
 'Copy of the publication in ECL Website regarding purchase/possession of land', NULL,
 '{"type":"document","multiple":false}',
 NULL, true, 70,
 'à¤­à¥‚à¤®à¤¿ à¤•à¥€ à¤–à¤°à¥€à¤¦/à¤•à¤¬à¥à¤œà¥‡ à¤•à¥‡ à¤¸à¤‚à¤¬à¤‚à¤§ à¤®à¥‡à¤‚ à¤ˆà¤¸à¥€à¤à¤² à¤µà¥‡à¤¬à¤¸à¤¾à¤‡à¤Ÿ à¤®à¥‡à¤‚ à¤ªà¥à¤°à¤•à¤¾à¤¶à¤¨ à¤•à¥€ à¤ªà¥à¤°à¤¤à¤¿'),

(gen_random_uuid(), 'FORM_IV_EMP', 'EMPLOYMENT_PROP', 'generated_document',
 'A copy of Form-IV (Land possession document)', NULL,
 '{"type":"generated_document","templateCode":"FORM_IV","template_code":"FORM_IV","multiple":false}',
 NULL, true, 80,
 'à¤«à¥‰à¤°à¥à¤®-IV (à¤­à¥‚à¤®à¤¿ à¤•à¤¬à¥à¤œà¤¾ à¤¦à¤¸à¥à¤¤à¤¾à¤µà¥‡à¤œ) à¤•à¥€ à¤à¤• à¤ªà¥à¤°à¤¤à¤¿'),

(gen_random_uuid(), 'CERT_RECONCILIATION_EMP', 'EMPLOYMENT_PROP', 'generated_document',
 'Reconciliation Certificate in Form-VII â€” Employment', NULL,
 '{"type":"generated_document","templateCode":"FORM_VII","template_code":"FORM_VII","multiple":false}',
 NULL, true, 90,
 'à¤«à¥‰à¤°à¥à¤®-VII à¤®à¥‡à¤‚ à¤¸à¤®à¤¾à¤§à¤¾à¤¨ à¤ªà¥à¤°à¤®à¤¾à¤£ à¤ªà¤¤à¥à¤° (à¤°à¥‹à¤œà¤—à¤¾à¤°)'),

(gen_random_uuid(), 'FORM_VIII_EMP', 'EMPLOYMENT_PROP', 'generated_document',
 'Land Utilization Certificate issued by Unit Authority in prescribed format (Form-VIII)', NULL,
 '{"type":"generated_document","templateCode":"FORM_VIII","template_code":"FORM_VIII","multiple":false}',
 NULL, true, 100,
 'à¤¨à¤¿à¤°à¥à¤§à¤¾à¤°à¤¿à¤¤ à¤ªà¥à¤°à¤¾à¤°à¥‚à¤ª (à¤«à¥‰à¤°à¥à¤®-VIII) à¤®à¥‡à¤‚ à¤¯à¥‚à¤¨à¤¿à¤Ÿ à¤ªà¥à¤°à¤¾à¤§à¤¿à¤•à¤°à¤£ à¤¦à¥à¤µà¤¾à¤°à¤¾ à¤œà¤¾à¤°à¥€ à¤•à¤¿à¤¯à¤¾ à¤œà¤¾à¤¨à¥‡ à¤µà¤¾à¤²à¤¾ à¤­à¥‚à¤®à¤¿ à¤‰à¤ªà¤¯à¥‹à¤— à¤ªà¥à¤°à¤®à¤¾à¤£ à¤ªà¤¤à¥à¤°'),

(gen_random_uuid(), 'FORM_IX_EMP', 'EMPLOYMENT_PROP', 'generated_document',
 'Duly filled in & signed Form-IX', NULL,
 '{"type":"generated_document","templateCode":"FORM_IX","template_code":"FORM_IX","multiple":false}',
 NULL, true, 110,
 'à¤µà¤¿à¤§à¤¿à¤µà¤¤ à¤­à¤°à¤¾ à¤”à¤° à¤¹à¤¸à¥à¤¤à¤¾à¤•à¥à¤·à¤°à¤¿à¤¤ à¤«à¥‰à¤°à¥à¤®-IX'),

(gen_random_uuid(), 'FORM_X_EMP', 'EMPLOYMENT_PROP', 'generated_document',
 'Duly filled in & signed Form-X', NULL,
 '{"type":"generated_document","templateCode":"FORM_X","template_code":"FORM_X","multiple":false}',
 NULL, true, 120,
 'à¤µà¤¿à¤§à¤¿à¤µà¤¤ à¤­à¤°à¤¾ à¤”à¤° à¤¹à¤¸à¥à¤¤à¤¾à¤•à¥à¤·à¤°à¤¿à¤¤ à¤«à¥‰à¤°à¥à¤®-X'),

(gen_random_uuid(), 'LAND_SCHEDULE_APPROVAL_EMP', 'EMPLOYMENT_PROP', 'document',
 'Copy of the Schedule of land approved by Competent Authority/Board highlighting plots involved in this proposal', NULL,
 '{"type":"document","multiple":false}',
 NULL, true, 130,
 'à¤¸à¤•à¥à¤·à¤® à¤ªà¥à¤°à¤¾à¤§à¤¿à¤•à¤¾à¤°à¥€/à¤¨à¤¿à¤¦à¥‡à¤¶à¤• à¤®à¤‚à¤¡à¤² à¤¦à¥à¤µà¤¾à¤°à¤¾ à¤…à¤¨à¥à¤®à¥‹à¤¦à¤¿à¤¤ à¤­à¥‚à¤®à¤¿ à¤•à¥€ à¤…à¤¨à¥à¤¸à¥‚à¤šà¥€ à¤•à¥€ à¤ªà¥à¤°à¤¤à¤¿'),

(gen_random_uuid(), 'EMPLOYMENT_APPROVAL_BOARD', 'EMPLOYMENT_PROP', 'document',
 'Copy of the approval of employment approved by Competent Authority/Board of Directors', NULL,
 '{"type":"document","multiple":false}',
 NULL, true, 140,
 'à¤¸à¤•à¥à¤·à¤® à¤ªà¥à¤°à¤¾à¤§à¤¿à¤•à¤¾à¤°à¥€/à¤¨à¤¿à¤¦à¥‡à¤¶à¤• à¤®à¤‚à¤¡à¤² à¤¦à¥à¤µà¤¾à¤°à¤¾ à¤…à¤¨à¥à¤®à¥‹à¤¦à¤¿à¤¤ à¤°à¥‹à¤œà¤—à¤¾à¤° à¤•à¥‡ à¤…à¤¨à¥à¤®à¥‹à¤¦à¤¨ à¤•à¥€ à¤ªà¥à¤°à¤¤à¤¿'),

(gen_random_uuid(), 'FORM_XI_EMP', 'EMPLOYMENT_PROP', 'generated_document',
 'Summary of land offered for employment in standard Form-XI', NULL,
 '{"type":"generated_document","templateCode":"FORM_XI","template_code":"FORM_XI","multiple":false}',
 NULL, true, 150,
 'à¤°à¥‹à¤œà¤—à¤¾à¤° à¤•à¥‡ à¤²à¤¿à¤ à¤¦à¥€ à¤—à¤ˆ à¤­à¥‚à¤®à¤¿ à¤•à¤¾ à¤¸à¤¾à¤°à¤¾à¤‚à¤¶ (à¤®à¤¾à¤¨à¤• à¤«à¥‰à¤°à¥à¤®-XI à¤®à¥‡à¤‚)'),

(gen_random_uuid(), 'FORM_XII_EMP', 'EMPLOYMENT_PROP', 'generated_document',
 'Gist of the land offered for employment in Form-XII', NULL,
 '{"type":"generated_document","templateCode":"FORM_XII","template_code":"FORM_XII","multiple":false}',
 NULL, true, 160,
 'à¤«à¥‰à¤°à¥à¤®-XII à¤®à¥‡à¤‚ à¤°à¥‹à¤œà¤—à¤¾à¤° à¤•à¥‡ à¤²à¤¿à¤ à¤¦à¥€ à¤—à¤ˆ à¤­à¥‚à¤®à¤¿ à¤•à¤¾ à¤¸à¤¾à¤°'),

(gen_random_uuid(), 'REGISTERED_DEEDS_EMP', 'EMPLOYMENT_PROP', 'document',
 'Copies of Registered deeds/legal instruments by which nominators obtained ownership of the offered lands', NULL,
 '{"type":"document","multiple":true}',
 NULL, true, 170,
 'à¤ªà¤‚à¤œà¥€à¤•à¥ƒà¤¤ à¤µà¤¿à¤²à¥‡à¤–à¥‹à¤‚/à¤•à¤¾à¤¨à¥‚à¤¨à¥€ à¤¦à¤¸à¥à¤¤à¤¾à¤µà¥‡à¤œà¥‹à¤‚ à¤•à¥€ à¤ªà¥à¤°à¤¤à¤¿à¤¯à¤¾à¤‚'),

(gen_random_uuid(), 'FORM_I_EMP', 'EMPLOYMENT_PROP', 'generated_document',
 'Copy of Form-I submitted by Landowner', NULL,
 '{"type":"generated_document","templateCode":"FORM_I","template_code":"FORM_I","multiple":false}',
 NULL, true, 180,
 'à¤­à¥‚à¤¸à¥à¤µà¤¾à¤®à¥€ à¤¦à¥à¤µà¤¾à¤°à¤¾ à¤ªà¥à¤°à¤¸à¥à¤¤à¥à¤¤ à¤«à¥‰à¤°à¥à¤®-I à¤•à¥€ à¤ªà¥à¤°à¤¤à¤¿'),

(gen_random_uuid(), 'POSSESSION_LAST_TRANSFEREE', 'EMPLOYMENT_PROP', 'boolean',
 'Whether possession of land has been obtained from the last transferee of the land', NULL,
 '{"type":"boolean"}',
 NULL, true, 190,
 'à¤•à¥à¤¯à¤¾ à¤­à¥‚à¤®à¤¿ à¤•à¤¾ à¤•à¤¬à¥à¤œà¤¾ à¤­à¥‚à¤®à¤¿ à¤•à¥‡ à¤…à¤‚à¤¤à¤¿à¤® à¤…à¤‚à¤¤à¤°à¤¿à¤¤à¥€ à¤¸à¥‡ à¤ªà¥à¤°à¤¾à¤ªà¥à¤¤ à¤•à¤° à¤²à¤¿à¤¯à¤¾ à¤—à¤¯à¤¾ à¤¹à¥ˆ'),

(gen_random_uuid(), 'COUNTERSIGN_NOMINEE_EMP', 'EMPLOYMENT_PROP', 'boolean',
 'Whether all pages of photocopies of documents have been countersigned by nominee with date and remark', NULL,
 '{"type":"boolean"}',
 NULL, true, 200,
 'à¤•à¥à¤¯à¤¾ à¤¦à¤¸à¥à¤¤à¤¾à¤µà¥‡à¤œà¥‹à¤‚ à¤•à¥€ à¤«à¥‹à¤Ÿà¥‹à¤•à¥‰à¤ªà¥€ à¤•à¥‡ à¤¸à¤­à¥€ à¤ªà¥ƒà¤·à¥à¤ à¥‹à¤‚ à¤ªà¤° à¤¨à¤¾à¤®à¤¾à¤‚à¤•à¤¿à¤¤ à¤µà¥à¤¯à¤•à¥à¤¤à¤¿ à¤¨à¥‡ à¤ªà¥à¤°à¤¤à¤¿à¤¹à¤¸à¥à¤¤à¤¾à¤•à¥à¤·à¤° à¤•à¤¿à¤ à¤¹à¥ˆà¤‚'),

(gen_random_uuid(), 'COUNTERSIGN_LAND_OFFICER_EMP', 'EMPLOYMENT_PROP', 'boolean',
 'Whether the above documents have been countersigned by the Area Land dealing officer with full name, designation, date and seal', NULL,
 '{"type":"boolean"}',
 NULL, true, 210,
 'à¤•à¥à¤¯à¤¾ à¤‰à¤ªà¤°à¥‹à¤•à¥à¤¤ à¤¦à¤¸à¥à¤¤à¤¾à¤µà¥‡à¤œà¥‹à¤‚ à¤ªà¤° à¤•à¥à¤·à¥‡à¤¤à¥à¤°à¥€à¤¯ à¤­à¥‚à¤®à¤¿ à¤¡à¥€à¤²à¤¿à¤‚à¤— à¤…à¤§à¤¿à¤•à¤¾à¤°à¥€ à¤¦à¥à¤µà¤¾à¤°à¤¾ à¤ªà¥à¤°à¤¤à¤¿à¤¹à¤¸à¥à¤¤à¤¾à¤•à¥à¤·à¤° à¤•à¤¿à¤ à¤—à¤ à¤¹à¥ˆà¤‚'),

(gen_random_uuid(), 'ROR_VERIFIED_EMP', 'EMPLOYMENT_PROP', 'boolean',
 'Whether R.O.Rs of the offered plots have been thoroughly examined and verified by concerned Revenue Inspector/Amin/land clerk/surveyor', NULL,
 '{"type":"boolean"}',
 NULL, true, 220,
 'à¤•à¥à¤¯à¤¾ à¤ªà¥à¤°à¤¸à¥à¤¤à¤¾à¤µà¤¿à¤¤ à¤­à¥‚à¤–à¤‚à¤¡à¥‹à¤‚ à¤•à¥‡ à¤†à¤°.à¤“.à¤†à¤°. à¤•à¥€ à¤¸à¤‚à¤¬à¤‚à¤§à¤¿à¤¤ à¤°à¤¾à¤œà¤¸à¥à¤µ à¤¨à¤¿à¤°à¥€à¤•à¥à¤·à¤• à¤¦à¥à¤µà¤¾à¤°à¤¾ à¤ªà¥‚à¤°à¥€ à¤¤à¤°à¤¹ à¤¸à¥‡ à¤œà¤¾à¤‚à¤š à¤”à¤° à¤¸à¤¤à¥à¤¯à¤¾à¤ªà¤¨ à¤•à¤¿à¤¯à¤¾ à¤—à¤¯à¤¾ à¤¹à¥ˆ'),

(gen_random_uuid(), 'OWNERSHIP_CERT_CIRCLE_OFFICER', 'EMPLOYMENT_PROP', 'document',
 'Ownership certificate of concerned Circle Officer/BL&LRO in favour of nominator of employment', NULL,
 '{"type":"document","multiple":false}',
 NULL, true, 230,
 'à¤°à¥‹à¤œà¤—à¤¾à¤° à¤•à¥‡ à¤¨à¤¾à¤®à¤¾à¤‚à¤•à¤¨à¤•à¤°à¥à¤¤à¤¾ à¤•à¥‡ à¤ªà¤•à¥à¤· à¤®à¥‡à¤‚ à¤¸à¤‚à¤¬à¤‚à¤§à¤¿à¤¤ à¤…à¤‚à¤šà¤² à¤…à¤§à¤¿à¤•à¤¾à¤°à¥€ à¤•à¤¾ à¤¸à¥à¤µà¤¾à¤®à¤¿à¤¤à¥à¤µ à¤ªà¥à¤°à¤®à¤¾à¤£ à¤ªà¤¤à¥à¤°'),

(gen_random_uuid(), 'MUTATION_IN_FAVOUR_ECL', 'EMPLOYMENT_PROP', 'boolean',
 'Whether plots offered for employment have been mutated in favour of ECL (except CBA Act or SPT/CNT Act)', NULL,
 '{"type":"boolean","conditionalText":true}',
 NULL, true, 240,
 'à¤•à¥à¤¯à¤¾ à¤°à¥‹à¤œà¤—à¤¾à¤° à¤•à¥‡ à¤²à¤¿à¤ à¤ªà¥à¤°à¤¸à¥à¤¤à¤¾à¤µà¤¿à¤¤ à¤­à¥‚à¤–à¤‚à¤¡à¥‹à¤‚ à¤•à¤¾ à¤ˆà¤¸à¥€à¤à¤² à¤•à¥‡ à¤ªà¤•à¥à¤· à¤®à¥‡à¤‚ à¤¦à¤¾à¤–à¤¿à¤²-à¤–à¤¾à¤°à¤¿à¤œ à¤•à¤¿à¤¯à¤¾ à¤—à¤¯à¤¾ à¤¹à¥ˆ'),

(gen_random_uuid(), 'PATTA_LAND_INVOLVED', 'EMPLOYMENT_PROP', 'boolean',
 'Is Patta land involved in the employment?', NULL,
 '{"type":"boolean"}',
 NULL, false, 250,
 'à¤•à¥à¤¯à¤¾ à¤°à¥‹à¤œà¤—à¤¾à¤° à¤®à¥‡à¤‚ à¤ªà¤Ÿà¥à¤Ÿà¤¾ à¤­à¥‚à¤®à¤¿ à¤¶à¤¾à¤®à¤¿à¤² à¤¹à¥ˆ?'),

(gen_random_uuid(), 'FORM_XVIII_EMP', 'EMPLOYMENT_PROP', 'generated_document',
 'Certificate in Form-XVIII (Status of cancellation of Patta)', NULL,
 '{"type":"generated_document","templateCode":"FORM_XVIII","template_code":"FORM_XVIII","multiple":false}',
 '{"has_patta_land":true}', true, 260,
 'à¤«à¥‰à¤°à¥à¤®-XVIII à¤®à¥‡à¤‚ à¤ªà¥à¤°à¤®à¤¾à¤£ à¤ªà¤¤à¥à¤° (à¤ªà¤Ÿà¥à¤Ÿà¤¾ à¤°à¤¦à¥à¤¦ à¤•à¤°à¤¨à¥‡ à¤•à¥€ à¤¸à¥à¤¥à¤¿à¤¤à¤¿)'),

(gen_random_uuid(), 'FORM_XIX_EMP', 'EMPLOYMENT_PROP', 'generated_document',
 'Affidavit of Patta-holder in standard Format Form-XIX (Activity Step 3.3.G)', NULL,
 '{"type":"generated_document","templateCode":"FORM_XIX","template_code":"FORM_XIX","multiple":false}',
 '{"has_patta_land":true}', true, 270,
 'à¤®à¤¾à¤¨à¤• à¤ªà¥à¤°à¤¾à¤°à¥‚à¤ª à¤«à¥‰à¤°à¥à¤®-XIX à¤®à¥‡à¤‚ à¤ªà¤Ÿà¥à¤Ÿà¤¾-à¤§à¤¾à¤°à¤• à¤•à¤¾ à¤¶à¤ªà¤¥ à¤ªà¤¤à¥à¤°'),

(gen_random_uuid(), 'FORM_XX_EMP', 'EMPLOYMENT_PROP', 'generated_document',
 'Agreement with Patta-holder in standard Format Form-XX (Activity Step 3.3.F)', NULL,
 '{"type":"generated_document","templateCode":"FORM_XX","template_code":"FORM_XX","multiple":false}',
 '{"has_patta_land":true}', true, 280,
 'à¤®à¤¾à¤¨à¤• à¤ªà¥à¤°à¤¾à¤°à¥‚à¤ª à¤«à¥‰à¤°à¥à¤®-XX à¤®à¥‡à¤‚ à¤ªà¤Ÿà¥à¤Ÿà¤¾-à¤§à¤¾à¤°à¤• à¤•à¥‡ à¤¸à¤¾à¤¥ à¤¸à¤®à¤à¥Œà¤¤à¤¾'),

(gen_random_uuid(), 'LAWYER_OPINION_EMP', 'EMPLOYMENT_PROP', 'document',
 'Opinion of the Lawyer covering all matters specified in Activity Step 3.3.B', NULL,
 '{"type":"document","multiple":false}',
 '{"has_patta_land":true}', true, 290,
 'à¤—à¤¤à¤¿à¤µà¤¿à¤§à¤¿ à¤šà¤°à¤£ 3.3.B à¤®à¥‡à¤‚ à¤¨à¤¿à¤°à¥à¤¦à¤¿à¤·à¥à¤Ÿ à¤¸à¤­à¥€ à¤®à¤¾à¤®à¤²à¥‹à¤‚ à¤•à¥‹ à¤•à¤µà¤° à¤•à¤°à¤¨à¥‡ à¤µà¤¾à¤²à¥‡ à¤µà¤•à¥€à¤² à¤•à¥€ à¤°à¤¾à¤¯'),

(gen_random_uuid(), 'PATTA_CERTIFICATES', 'EMPLOYMENT_PROP', 'document',
 'Copy of Patta Certificates', NULL,
 '{"type":"document","multiple":true}',
 '{"has_patta_land":true}', true, 300,
 'à¤ªà¤Ÿà¥à¤Ÿà¤¾ à¤ªà¥à¤°à¤®à¤¾à¤£ à¤ªà¤¤à¥à¤°à¥‹à¤‚ à¤•à¥€ à¤ªà¥à¤°à¤¤à¤¿'),

(gen_random_uuid(), 'DEBOTTAR_LAND_INVOLVED', 'EMPLOYMENT_PROP', 'boolean',
 'Is Debottar land involved in the employment?', NULL,
 '{"type":"boolean","conditionalUpload":{"trigger":"YES","label":"Upload Debottar Land Clearance"}}',
 NULL, false, 310,
 'à¤•à¥à¤¯à¤¾ à¤°à¥‹à¤œà¤—à¤¾à¤° à¤®à¥‡à¤‚ à¤¦à¥‡à¤¬à¥‹à¤¤à¥à¤¤à¤° (Debottar) à¤­à¥‚à¤®à¤¿ à¤¶à¤¾à¤®à¤¿à¤² à¤¹à¥ˆ?'),

(gen_random_uuid(), 'TRIBAL_LAND_INVOLVED', 'EMPLOYMENT_PROP', 'boolean',
 'Is Tribal land involved in the employment?', NULL,
 '{"type":"boolean","conditionalUpload":{"trigger":"YES","label":"Upload Tribal Land Approval"}}',
 NULL, false, 320,
 'à¤•à¥à¤¯à¤¾ à¤°à¥‹à¤œà¤—à¤¾à¤° à¤®à¥‡à¤‚ à¤†à¤¦à¤¿à¤µà¤¾à¤¸à¥€ à¤­à¥‚à¤®à¤¿ à¤¶à¤¾à¤®à¤¿à¤² à¤¹à¥ˆ?'),

(gen_random_uuid(), 'MUTATION_DOCUMENT_ECL', 'EMPLOYMENT_PROP', 'boolean',
 'Mutation document in favour of ECL â€” If not mutated: proper justification by Area Land dealing officer and AGM', NULL,
 '{"type":"boolean","conditionalText":true}',
 NULL, true, 330,
 'à¤ˆà¤¸à¥€à¤à¤² à¤•à¥‡ à¤ªà¤•à¥à¤· à¤®à¥‡à¤‚ à¤¦à¤¾à¤–à¤¿à¤²-à¤–à¤¾à¤°à¤¿à¤œ (Mutation) à¤¦à¤¸à¥à¤¤à¤¾à¤µà¥‡à¤œ'),

(gen_random_uuid(), 'REGISTER_II_STATE_REVENUE', 'EMPLOYMENT_PROP', 'boolean',
 'Whether the name of landowner is recorded in Register-II of State Revenue Department, Jharkhand?', NULL,
 '{"type":"boolean","conditionalUpload":{"YES":"Upload Register-II record","NO":"Enter explanation"}}',
 NULL, false, 340,
 'à¤•à¥à¤¯à¤¾ à¤­à¥‚à¤¸à¥à¤µà¤¾à¤®à¥€ à¤•à¤¾ à¤¨à¤¾à¤® à¤°à¤¾à¤œà¥à¤¯ à¤°à¤¾à¤œà¤¸à¥à¤µ à¤µà¤¿à¤­à¤¾à¤—, à¤à¤¾à¤°à¤–à¤‚à¤¡ à¤•à¥‡ à¤°à¤œà¤¿à¤¸à¥à¤Ÿà¤°-II à¤®à¥‡à¤‚ à¤¦à¤°à¥à¤œ à¤¹à¥ˆ?'),

(gen_random_uuid(), 'AFFIDAVIT_LANDOWNER', 'EMPLOYMENT_PROP', 'document',
 'Copy of Affidavit sworn by the landowner', NULL,
 '{"type":"document","multiple":false}',
 NULL, false, 350,
 'à¤­à¥‚à¤¸à¥à¤µà¤¾à¤®à¥€ à¤¦à¥à¤µà¤¾à¤°à¤¾ à¤¶à¤ªà¤¥ à¤ªà¤¤à¥à¤° (Affidavit) à¤•à¥€ à¤ªà¥à¤°à¤¤à¤¿'),

(gen_random_uuid(), 'INDEMNITY_BOND_LANDOWNER', 'EMPLOYMENT_PROP', 'document',
 'Copy of Indemnity Bond executed by the landowner', NULL,
 '{"type":"document","multiple":false}',
 NULL, false, 360,
 'à¤­à¥‚à¤¸à¥à¤µà¤¾à¤®à¥€ à¤¦à¥à¤µà¤¾à¤°à¤¾ à¤¨à¤¿à¤·à¥à¤ªà¤¾à¤¦à¤¿à¤¤ à¤•à¥à¤·à¤¤à¤¿à¤ªà¥‚à¤°à¥à¤¤à¤¿ à¤¬à¤¾à¤‚à¤¡ (Indemnity Bond) à¤•à¥€ à¤ªà¥à¤°à¤¤à¤¿'),

(gen_random_uuid(), 'CLEARANCE_DGMS_EMP', 'EMPLOYMENT_PROP', 'document',
 'Copies of Statutory clearances like DGMS approval etc., if obtained â€” Employment', NULL,
 '{"type":"document","multiple":true}',
 NULL, false, 370,
 'à¤µà¥ˆà¤§à¤¾à¤¨à¤¿à¤• à¤®à¤‚à¤œà¥‚à¤°à¥€ à¤•à¥€ à¤ªà¥à¤°à¤¤à¤¿à¤¯à¤¾à¤‚ à¤œà¥ˆà¤¸à¥‡ à¤¡à¥€à¤œà¥€à¤à¤®à¤à¤¸ à¤†à¤¦à¤¿ (à¤°à¥‹à¤œà¤—à¤¾à¤°)')

ON CONFLICT (chk_code) DO NOTHING;
