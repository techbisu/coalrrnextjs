import type { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

/**
 * Seed: Proposal Checklist Requirements (CL1 — LAND_ACQ_PROPOSAL module)
 * 
 * These rules are evaluated per proposal and gate the submission flow.
 * show_if: { acqModeId: [1] }  → CBA Act only
 * show_if: { acqModeId: [2] }  → RFCTLARR only
 * show_if: null                → always show
 */
export async function seedProposalChecklist(db: PrismaClient) {
  console.log('🌱 Seeding checklist_requirement_rule [LAND_ACQ_PROPOSAL]...')

  const MODULE = 'LAND_ACQ_PROPOSAL'

  const rules = [
    // === UNIVERSAL REQUIREMENTS (all modes) ===
    {
      id: 'PROP_CL_001',
      module_code: MODULE,
      requirement_type: 'DOCUMENT_UPLOAD',
      title: 'Purpose & Justification',
      description: 'A specific proposal stating purpose, justification and detailing with respect to acquisition of land.',
      is_mandatory: true,
      display_order: 10,
      show_if: null,
    },
    {
      id: 'PROP_CL_002',
      module_code: MODULE,
      requirement_type: 'DOCUMENT_UPLOAD',
      title: 'Schedule of Land (Tabular)',
      description: 'Schedule of land in tabular form with land type-wise and mouza-wise abstract.',
      is_mandatory: true,
      display_order: 20,
      show_if: null,
    },
    {
      id: 'PROP_CL_003',
      module_code: MODULE,
      requirement_type: 'CUSTOM',
      title: 'Reconciliation Certificate (Form VII)',
      description: 'Copy of reconciliation certificate (Form VII) duly signed by competent authority.',
      is_mandatory: true,
      display_order: 30,
      show_if: null,
      input_schema: { type: 'generated_document', template_code: 'FORM_VII', auto_complete_on_final: true },
    },
    {
      id: 'PROP_CL_004',
      module_code: MODULE,
      requirement_type: 'DOCUMENT_UPLOAD',
      title: 'Revenue Plan (Mouza Map)',
      description: 'A revenue plan showing boundary of approved project/working area, important surface features, land types washed in different colours.',
      is_mandatory: true,
      display_order: 40,
      show_if: null,
    },
    {
      id: 'PROP_CL_005',
      module_code: MODULE,
      requirement_type: 'DOCUMENT_UPLOAD',
      title: 'Relevant Pages — Approved PR/Scheme',
      description: 'Copies of relevant pages of approved Project Report / Scheme / Conceptual Report of the Mine/Project.',
      is_mandatory: true,
      display_order: 50,
      show_if: null,
    },
    {
      id: 'PROP_CL_006',
      module_code: MODULE,
      requirement_type: 'DOCUMENT_UPLOAD',
      title: 'Techno-Economic Report',
      description: 'Techno-Economic Report showing estimated total financial involvement and capital involvement for cost of land acquisition, rehabilitation and employment for land.',
      is_mandatory: true,
      display_order: 60,
      show_if: null,
    },
    {
      id: 'PROP_CL_007',
      module_code: MODULE,
      requirement_type: 'DOCUMENT_UPLOAD',
      title: 'Area Land Cell Committee Recommendation',
      description: 'Report on examination of the proposal by the Area Land Cell Committee and recommendation thereof.',
      is_mandatory: true,
      display_order: 70,
      show_if: null,
    },
    {
      id: 'PROP_CL_008',
      module_code: MODULE,
      requirement_type: 'DOCUMENT_UPLOAD',
      title: 'Area General Manager Recommendation',
      description: 'Recommendation of the Area General Manager.',
      is_mandatory: true,
      display_order: 80,
      show_if: null,
    },
    {
      id: 'PROP_CL_009',
      module_code: MODULE,
      requirement_type: 'YES_NO',
      title: 'Quantum Within Approved Project Limit',
      description: 'Whether the quantum of land to be acquired is within the limit approved in the Project Report / Scheme / Conceptual Report of the Mine/Project.',
      is_mandatory: true,
      display_order: 90,
      show_if: null,
    },
    {
      id: 'PROP_CL_010',
      module_code: MODULE,
      requirement_type: 'YES_NO',
      title: 'Land Data Authenticated by Revenue Authority',
      description: 'Whether the land data has been authenticated by the concerned authorities of the District revenue department.',
      is_mandatory: true,
      display_order: 100,
      show_if: null,
    },

    // === CBA ACT SPECIFIC (acqModeId = 1) ===
    {
      id: 'PROP_CL_101',
      module_code: MODULE,
      requirement_type: 'DOCUMENT_UPLOAD',
      title: 'Copy of Notification under Section 4 (CBA)',
      description: 'Copy of Notification under Section 4 of the CBA Act.',
      is_mandatory: true,
      display_order: 110,
      show_if: { acqModeId: [1] },
    },
    {
      id: 'PROP_CL_102',
      module_code: MODULE,
      requirement_type: 'DOCUMENT_UPLOAD',
      title: 'Copy of Notification under Section 7 (CBA)',
      description: 'Copy of Notification under Section 7 of the CBA Act.',
      is_mandatory: false,
      display_order: 120,
      show_if: { acqModeId: [1] },
    },
    {
      id: 'PROP_CL_103',
      module_code: MODULE,
      requirement_type: 'CUSTOM',
      title: 'Five-Point Certificate (Form XVI)',
      description: 'A FIVE-POINT certificate in Form XVI.',
      is_mandatory: true,
      display_order: 130,
      show_if: { acqModeId: [1] },
      input_schema: { type: 'generated_document', template_code: 'FORM_XVI', auto_complete_on_final: true },
    },
    {
      id: 'PROP_CL_104',
      module_code: MODULE,
      requirement_type: 'DOCUMENT_UPLOAD',
      title: 'Standard Checklist (ECL/CMD/LRE Office Order)',
      description: 'A standard Check List as circulated through Office Order (Ref. No. ECL/CMD/LRE/ANG/Check-list/1071 Date 25th Nov 2005).',
      is_mandatory: true,
      display_order: 140,
      show_if: { acqModeId: [1] },
    },
    {
      id: 'PROP_CL_105',
      module_code: MODULE,
      requirement_type: 'DOCUMENT_UPLOAD',
      title: 'Statutory Clearances (DGMS etc.)',
      description: 'Copies of statutory clearances like approval obtained from DGMS etc., if obtained.',
      is_mandatory: false,
      display_order: 150,
      show_if: { acqModeId: [1] },
    },

    // === RFCTLARR SPECIFIC (acqModeId = 2) ===
    {
      id: 'PROP_CL_201',
      module_code: MODULE,
      requirement_type: 'DOCUMENT_UPLOAD',
      title: 'Board Approval Copy (RFCTLARR)',
      description: 'A copy of the Board approval for acquisition under RFCTLARR Act 2013.',
      is_mandatory: true,
      display_order: 210,
      show_if: { acqModeId: [2] },
    },

    // === TRIBAL LAND (HAS_TRIBAL_LAND = true) ===
    {
      id: 'PROP_CL_301',
      module_code: MODULE,
      requirement_type: 'DOCUMENT_UPLOAD',
      title: 'Approval — District Authority for Tribal Land',
      description: 'Copy of approval of District Authority for purchase of Tribal Land.',
      is_mandatory: true,
      display_order: 310,
      show_if: { HAS_TRIBAL_LAND: true },
    },

    // === DEBOTTAR LAND (HAS_DEBOTTAR_LAND = true) ===
    {
      id: 'PROP_CL_401',
      module_code: MODULE,
      requirement_type: 'DOCUMENT_UPLOAD',
      title: 'Approval — Employment Against Debottar Land',
      description: 'Approval of employment against the debottar land.',
      is_mandatory: true,
      display_order: 410,
      show_if: { HAS_DEBOTTAR_LAND: true },
    },

    // === GENERATED DOCUMENTS (FORMS) ===
    {
      id: 'PROP_CL_GEN_XXII',
      module_code: MODULE,
      requirement_type: 'CUSTOM',
      title: 'Form XXII',
      description: 'Generated Form XXII',
      is_mandatory: false,
      display_order: 500,
      show_if: null,
      input_schema: { type: 'generated_document', template_code: 'FORM_XXII', auto_complete_on_final: true },
    },
    {
      id: 'PROP_CL_GEN_III',
      module_code: MODULE,
      requirement_type: 'CUSTOM',
      title: 'Form III',
      description: 'Generated Form III',
      is_mandatory: false,
      display_order: 510,
      show_if: null,
      input_schema: { type: 'generated_document', template_code: 'FORM_III', auto_complete_on_final: true },
    },
    {
      id: 'PROP_CL_GEN_II',
      module_code: MODULE,
      requirement_type: 'CUSTOM',
      title: 'Form II',
      description: 'Generated Form II',
      is_mandatory: false,
      display_order: 520,
      show_if: null,
      input_schema: { type: 'generated_document', template_code: 'FORM_II', auto_complete_on_final: true },
    },
    {
      id: 'PROP_CL_GEN_VIII',
      module_code: MODULE,
      requirement_type: 'CUSTOM',
      title: 'Form VIII',
      description: 'Generated Form VIII',
      is_mandatory: false,
      display_order: 530,
      show_if: null,
      input_schema: { type: 'generated_document', template_code: 'FORM_VIII', auto_complete_on_final: true },
    },
    {
      id: 'PROP_CL_GEN_XXIV',
      module_code: MODULE,
      requirement_type: 'CUSTOM',
      title: 'Form XXIV',
      description: 'Generated Form XXIV',
      is_mandatory: false,
      display_order: 540,
      show_if: null,
      input_schema: { type: 'generated_document', template_code: 'FORM_XXIV', auto_complete_on_final: true },
    },
    {
      id: 'PROP_CL_GEN_1A',
      module_code: MODULE,
      requirement_type: 'CUSTOM',
      title: 'Form 1A/1B',
      description: 'Generated Form 1A/1B',
      is_mandatory: false,
      display_order: 550,
      show_if: null,
      input_schema: { type: 'generated_document', template_code: 'FORM_1A_1B', auto_complete_on_final: true },
    },
  ]

  for (const rule of rules) {
    await db.checklist_requirement_rule.upsert({
      where: { id: rule.id },
      update: {
        title: rule.title,
        description: rule.description,
        is_mandatory: rule.is_mandatory,
        display_order: rule.display_order,
        show_if: rule.show_if ? rule.show_if as any : undefined,
        input_schema: (rule as any).input_schema ? (rule as any).input_schema : undefined,
        is_active: true,
      },
      create: {
        id: rule.id,
        module_code: rule.module_code,
        requirement_type: rule.requirement_type,
        title: rule.title,
        description: rule.description ?? null,
        is_mandatory: rule.is_mandatory,
        display_order: rule.display_order,
        show_if: rule.show_if ? rule.show_if as any : undefined,
        input_schema: (rule as any).input_schema ? (rule as any).input_schema : undefined,
        is_active: true,
        entry_by: 'seed',
        updt_by: 'seed',
      },
    })
  }

  console.log(`  ✅ Seeded ${rules.length} LAND_ACQ_PROPOSAL checklist rules`)
}
