import type { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'

export async function seedDocumentTemplate(db: PrismaClient) {
  console.log('🌱 Seeding document_template and document_template_field...')

  const templates = [
    // ── Form-VII: Joint Reconciliation Certificate ────────────────────────
    {
      template_code: 'FORM_VII',
      template_name: 'Form-VII: Joint Reconciliation & Boundary Demarcation Certificate',
      description: '12-Signature inter-colliery and inter-area land boundary reconciliation certificate.',
      storage_path: 'Form-VII-Template.docx',
      config: {
        category: 'CHECKLIST',
        module_code: 'LAND_SCHEDULE',
        version: '1.0',
        requires_adjacent_colliery: true,
      },
    },

    // ── Form-XVI: Five-Point Land Certificate ─────────────────────────────
    {
      template_code: 'FORM_XVI',
      template_name: 'Form-XVI: Five-Point Land Certificate',
      description: 'Unit-level certificate certifying five critical statutory land conditions prior to acquisition.',
      storage_path: 'Form-XVI-Template.docx',
      config: {
        category: 'CHECKLIST',
        module_code: 'LAND_SCHEDULE',
        version: '1.0',
      },
    },

    // ── Form-XXII: Area Land Cell Clearance ───────────────────────────────
    {
      template_code: 'FORM_XXII',
      template_name: 'Form-XXII: Area Land Cell Clearance Certificate',
      description: 'Area land clearance and statutory vetting certificate required before submission to HQ.',
      storage_path: 'Form-XXII-Template.docx',
      config: {
        category: 'CHECKLIST',
        module_code: 'LAND_SCHEDULE',
        version: '1.0',
      },
    },

    // ── Form-I: General Land Identification ──────────────────────────────
    {
      template_code: 'FORM_I',
      template_name: 'Form-I: Land Schedule Particulars',
      description: 'Initial schedule of land with mouza, khatian, plot, and classification details.',
      storage_path: 'Form-I-Template.docx',
      config: { category: 'PROPOSAL', module_code: 'LAND_SCHEDULE' },
    },

    // ── Form-II: Tenancy Land Assessment ──────────────────────────────────
    {
      template_code: 'FORM_II',
      template_name: 'Form-II: Tenancy Land Assessment Report',
      description: 'Assessment sheet for private raiyati / tenancy plots.',
      storage_path: 'Form-II-Template.docx',
      config: { category: 'CHECKLIST', module_code: 'LAND_SCHEDULE' },
    },

    // ── Form-III: Government & Patta Land Verification ────────────────────
    {
      template_code: 'FORM_III',
      template_name: 'Form-III: Government & Patta Land Verification',
      description: 'Verification of state government, vested, and patta land records.',
      storage_path: 'Form-III-Template.docx',
      config: { category: 'CHECKLIST', module_code: 'LAND_SCHEDULE' },
    },

    // ── Form-IV: Forest Land Clearance Particulars ────────────────────────
    {
      template_code: 'FORM_IV',
      template_name: 'Form-IV: Forest Land Clearance Particulars',
      description: 'Statutory forest land diversion particulars sheet.',
      storage_path: 'Form-IV-Template.docx',
      config: { category: 'LEGAL', module_code: 'LAND_SCHEDULE' },
    },

    // ── Form-VI: Pre-Notification Verification ────────────────────────────
    {
      template_code: 'FORM_VI',
      template_name: 'Form-VI: Pre-Notification Land Schedule Verification',
      description: 'Pre-notification checklist sheet for revenue officer verification.',
      storage_path: 'Form-VI-Template.docx',
      config: { category: 'CHECKLIST', module_code: 'LAND_SCHEDULE' },
    },

    // ── Form-VIII: Employment & Nominee Assessment ────────────────────────
    {
      template_code: 'FORM_VIII',
      template_name: 'Form-VIII: R&R Employment Eligibility Assessment',
      description: 'Assessment sheet for land-loser employment and nominee entitlement.',
      storage_path: 'Form-VIII-Template.docx',
      config: { category: 'CHECKLIST', module_code: 'EMPLOYMENT_APP' },
    },

    // ── Form-IX: Structural & Tree Asset Valuation ────────────────────────
    {
      template_code: 'FORM_IX',
      template_name: 'Form-IX: Structural & Tree Asset Valuation Register',
      description: 'Census register of immovable structures, wells, and trees on acquired plots.',
      storage_path: 'Form-IX-Template.docx',
      config: { category: 'VALUATION', module_code: 'COMPENSATION_PAYROLL' },
    },

    // ── Form-X: Solatium & Interest Computation ───────────────────────────
    {
      template_code: 'FORM_X',
      template_name: 'Form-X: Solatium & Additional Compensation Sheet',
      description: 'Computation schedule for statutory solatium (100%) and 12% additional interest.',
      storage_path: 'Form-X-Template.docx',
      config: { category: 'COMPENSATION', module_code: 'COMPENSATION_PAYROLL' },
    },

    // ── Form-XI: Preliminary Compensation Award ───────────────────────────
    {
      template_code: 'FORM_XI',
      template_name: 'Form-XI: Preliminary Land Compensation Award Statement',
      description: 'Award statement showing plot-wise compensation breakdowns.',
      storage_path: 'Form-XI-Template.docx',
      config: { category: 'COMPENSATION', module_code: 'COMPENSATION_PAYROLL' },
    },

    // ── Form-XII: Public Notice of Award ──────────────────────────────────
    {
      template_code: 'FORM_XII',
      template_name: 'Form-XII: Public Notice for Award Disbursement',
      description: 'Statutory public notice issued to awardees for claim submission.',
      storage_path: 'Form-XII-Template.docx',
      config: { category: 'NOTICE', module_code: 'COMPENSATION_PAYROLL' },
    },

    // ── Form-XIII: Possession Handover Certificate ─────────────────────────
    {
      template_code: 'FORM_XIII',
      template_name: 'Form-XIII: Possession Taking & Handover Certificate',
      description: 'Formal handover certificate between Land Revenue Authorities and Colliery Unit.',
      storage_path: 'Form-XIII-Template.docx',
      config: { category: 'POSSESSION', module_code: 'LAND_SCHEDULE' },
    },

    // ── Form-XIV: Mutation & Title Entry Report ───────────────────────────
    {
      template_code: 'FORM_XIV',
      template_name: 'Form-XIV: Revenue Mutation & Record Correction Report',
      description: 'Certificate recording mutation of acquired land in ECL favoring records.',
      storage_path: 'Form-XIV-Template.docx',
      config: { category: 'MUTATION', module_code: 'LAND_SCHEDULE' },
    },

    // ── Form-XV: Legal Clearance Certificate ──────────────────────────────
    {
      template_code: 'FORM_XV',
      template_name: 'Form-XV: Non-Encumbrance & Legal Title Certificate',
      description: 'Legal non-encumbrance certificate vetted by legal cell.',
      storage_path: 'Form-XV-Template.docx',
      config: { category: 'LEGAL', module_code: 'LAND_SCHEDULE' },
    },

    // ── Form-XVA: Court Dispute & Injunction Status ────────────────────────
    {
      template_code: 'FORM_XVA',
      template_name: 'Form-XVA: Court Dispute & Injunction Status Report',
      description: 'Report certifying whether pending litigation affects the schedule.',
      storage_path: 'Form-XVA-Template.docx',
      config: { category: 'LEGAL', module_code: 'LAND_SCHEDULE' },
    },

    // ── Form-XVII: Safety & Mine Working Distance Clearance ───────────────
    {
      template_code: 'FORM_XVII',
      template_name: 'Form-XVII: Mine Safety & DGMS Working Distance Clearance',
      description: 'Clearance from safety officer verifying DGMS blasting and surface distance regulations.',
      storage_path: 'Form-XVII-Template.docx',
      config: { category: 'SAFETY', module_code: 'LAND_SCHEDULE' },
    },

    // ── Form-XVIII: Environmental & Forest Clearance Status ───────────────
    {
      template_code: 'FORM_XVIII',
      template_name: 'Form-XVIII: Environmental & Forest Clearance Verification',
      description: 'EC/FC status and statutory clearance particulars.',
      storage_path: 'Form-XVIII-Template.docx',
      config: { category: 'ENVIRONMENT', module_code: 'LAND_SCHEDULE' },
    },

    // ── Form-XIX: Resettlement & Rehabilitation Master Plan ────────────────
    {
      template_code: 'FORM_XIX',
      template_name: 'Form-XIX: R&R Site Identification & Master Plan',
      description: 'Resettlement site demarcation and infrastructure commitment sheet.',
      storage_path: 'Form-XIX-Template.docx',
      config: { category: 'RNR', module_code: 'EMPLOYMENT_APP' },
    },

    // ── Form-XXI: Board Approval Memorandum ───────────────────────────────
    {
      template_code: 'FORM_XXI',
      template_name: 'Form-XXI: Board Approval Memorandum & Sanction Note',
      description: 'Comprehensive memorandum submitted for Board / CMD sanction.',
      storage_path: 'Form-XXI-Template.docx',
      config: { category: 'SANCTION', module_code: 'LAND_SCHEDULE' },
    },

    // ── Form-XXIII: Finance Concurrence Memorandum ────────────────────────
    {
      template_code: 'FORM_XXIII',
      template_name: 'Form-XXIII: Finance Concurrence & Fund Allocation Note',
      description: 'Financial concurrence certificate signed by GM Finance.',
      storage_path: 'Form-XXIII-Template.docx',
      config: { category: 'FINANCE', module_code: 'LAND_SCHEDULE' },
    },

    // ── Form-XXIV: Final Vesting Declaration ──────────────────────────────
    {
      template_code: 'FORM_XXIV',
      template_name: 'Form-XXIV: Final Vesting & Notification Declaration',
      description: 'Declaration of statutory vesting under CBA / LA Act.',
      storage_path: 'Form-XXIV-Template.docx',
      config: { category: 'CHECKLIST', module_code: 'LAND_SCHEDULE' },
    },

    // ── Form-A: Baseline PAF Census Form ──────────────────────────────────
    {
      template_code: 'FORM_A',
      template_name: 'Form-A: Project Affected Family (PAF) Baseline Survey',
      description: 'Comprehensive socio-economic census form for PAFs.',
      storage_path: 'Form-A-Template.docx',
      config: { category: 'CENSUS', module_code: 'EMPLOYMENT_APP' },
    },

    // ── Form-B: Nominee Entitlement Sheet ─────────────────────────────────
    {
      template_code: 'FORM_B',
      template_name: 'Form-B: Nominee Entitlement & Affidavit',
      description: 'Family tree and nominee entitlement determination form.',
      storage_path: 'Form-B-Template.docx',
      config: { category: 'ENTITLEMENT', module_code: 'EMPLOYMENT_APP' },
    },

    // ── Form-C: Screening Committee Recommendation ─────────────────────────
    {
      template_code: 'FORM_C',
      template_name: 'Form-C: Screening Committee Recommendation Report',
      description: 'Area Screening Committee employment recommendation sheet.',
      storage_path: 'Form-C-Template.docx',
      config: { category: 'SCREENING', module_code: 'EMPLOYMENT_APP' },
    },

    // ── Form-D: Compensation Disbursement Ledger ──────────────────────────
    {
      template_code: 'FORM_D',
      template_name: 'Form-D: Compensation Disbursement Register',
      description: 'Ledger register recording individual bank transactions and vouchers.',
      storage_path: 'Form-D-Template.docx',
      config: { category: 'DISBURSEMENT', module_code: 'COMPENSATION_PAYROLL' },
    },

    // ── Attestation Form ──────────────────────────────────────────────────
    {
      template_code: 'ATTESTATION_FORM',
      template_name: 'Statutory Attestation & Verification Form',
      description: 'Candidate attestation form for identity and police verification.',
      storage_path: 'Attestation Form.docx',
      config: { category: 'VERIFICATION', module_code: 'EMPLOYMENT_APP' },
    },
  ]

  for (const t of templates) {
    const existing = await (db as any).document_template.findUnique({
      where: { template_code: t.template_code },
    })

    if (existing) {
      await (db as any).document_template.update({
        where: { id: existing.id },
        data: {
          template_name: t.template_name,
          description: t.description,
          storage_path: t.storage_path,
          config: t.config,
          is_active: true,
          updt_ts: new Date(),
        },
      })
    } else {
      await (db as any).document_template.create({
        data: {
          id: randomUUID(),
          template_code: t.template_code,
          template_name: t.template_name,
          description: t.description,
          storage_path: t.storage_path,
          config: t.config,
          is_active: true,
          entry_ts: new Date(),
          updt_ts: new Date(),
          entry_by: 'system',
        },
      })
    }
  }

  console.log(`✅ Seeded ${templates.length} document_template rows.`)

  // ══════════════════════════════════════════════════════════════════════════
  // DYNAMIC FORM FIELDS (document_template_field)
  // ══════════════════════════════════════════════════════════════════════════
  const fields = [
    // ── Form-XVI Dynamic Certification Fields ───────────────────────────────
    {
      template_code: 'FORM_XVI',
      field_key: 'ecl_not_previously_acquired',
      field_type: 'select',
      label: 'Land never acquired/purchased by ECL before or belongs to ECL by any means',
      options: ['Yes', 'No'],
      is_required: true,
      display_order: 1,
    },
    {
      template_code: 'FORM_XVI',
      field_key: 'not_acquired_by_erstwhile_management',
      field_type: 'select',
      label: 'Land was not acquired/purchased by erstwhile management',
      options: ['Yes', 'No'],
      is_required: true,
      display_order: 2,
    },
    {
      template_code: 'FORM_XVI',
      field_key: 'not_affected_before_nationalization',
      field_type: 'select',
      label: 'Land has not been affected/damaged before Nationalization',
      options: ['Yes', 'No'],
      is_required: true,
      display_order: 3,
    },
    {
      template_code: 'FORM_XVI',
      field_key: 'not_government_or_vested_land',
      field_type: 'select',
      label: 'Land is not a Government / Vested land without due permission',
      options: ['Yes', 'No'],
      is_required: true,
      display_order: 4,
    },
    {
      template_code: 'FORM_XVI',
      field_key: 'not_under_master_plan_rehabilitation',
      field_type: 'select',
      label: 'Land is not included in Raniganj Master Plan or any rehabilitation scheme',
      options: ['Yes', 'No'],
      is_required: true,
      display_order: 5,
    },
    {
      template_code: 'FORM_XVI',
      field_key: 'special_remarks',
      field_type: 'textarea',
      label: 'Special Remarks & Field Observations',
      is_required: false,
      display_order: 6,
    },

    // ── Form-VII Joint Reconciliation Fields ────────────────────────────────
    {
      template_code: 'FORM_VII',
      field_key: 'boundary_pillars_verified',
      field_type: 'select',
      label: 'Have boundary pillars been physically inspected & verified on ground?',
      options: ['Yes', 'No'],
      is_required: true,
      display_order: 1,
    },
    {
      template_code: 'FORM_VII',
      field_key: 'adjacent_colliery_name',
      field_type: 'text',
      label: 'Name of Adjacent Colliery / Project',
      is_required: true,
      display_order: 2,
    },
    {
      template_code: 'FORM_VII',
      field_key: 'overlap_dispute_status',
      field_type: 'select',
      label: 'Any boundary dispute or overlap with adjacent mine?',
      options: ['No Dispute / Clean Demarcation', 'Minor Discrepancy Resolved', 'Pending Joint Survey'],
      is_required: true,
      display_order: 3,
    },
    {
      template_code: 'FORM_VII',
      field_key: 'joint_inspection_date',
      field_type: 'date',
      label: 'Date of Joint Ground Demarcation Survey',
      is_required: true,
      display_order: 4,
    },
    {
      template_code: 'FORM_VII',
      field_key: 'reconciliation_remarks',
      field_type: 'textarea',
      label: 'Joint Demarcation Remarks & Agreement Notes',
      is_required: false,
      display_order: 5,
    },

    // ── Form-XXII Area Clearance Fields ─────────────────────────────────────
    {
      template_code: 'FORM_XXII',
      field_key: 'area_committee_meeting_date',
      field_type: 'date',
      label: 'Date of Area Land Committee Review Meeting',
      is_required: true,
      display_order: 1,
    },
    {
      template_code: 'FORM_XXII',
      field_key: 'statutory_compliance_verified',
      field_type: 'select',
      label: 'Are all statutory prerequisites (Forms I-XVI, Mouza Map, RR Plan) verified?',
      options: ['Yes - Full Compliance', 'Conditional - Deviations Flagged'],
      is_required: true,
      display_order: 2,
    },
    {
      template_code: 'FORM_XXII',
      field_key: 'fund_provision_recommended',
      field_type: 'number',
      label: 'Recommended Fund Provision (₹ in Crores)',
      is_required: true,
      display_order: 3,
    },
    {
      template_code: 'FORM_XXII',
      field_key: 'area_gm_recommendation_notes',
      field_type: 'textarea',
      label: 'Area General Manager Recommendation & Submissions to HQ',
      is_required: true,
      display_order: 4,
    },
  ]

  for (const f of fields) {
    const existing = await (db as any).document_template_field.findFirst({
      where: {
        template_code: f.template_code,
        field_key: f.field_key,
      },
    })

    if (existing) {
      await (db as any).document_template_field.update({
        where: { id: existing.id },
        data: {
          field_type: f.field_type,
          label: f.label,
          options: f.options,
          is_required: f.is_required,
          display_order: f.display_order,
          is_active: true,
          updt_ts: new Date(),
        },
      })
    } else {
      await (db as any).document_template_field.create({
        data: {
          id: randomUUID(),
          template_code: f.template_code,
          field_key: f.field_key,
          field_type: f.field_type,
          label: f.label,
          options: f.options,
          is_required: f.is_required,
          display_order: f.display_order,
          is_active: true,
          entry_ts: new Date(),
          updt_ts: new Date(),
          entry_by: 'system',
        },
      })
    }
  }

  console.log(`✅ Seeded ${fields.length} dynamic document_template_field records for Form-XVI, Form-VII, and Form-XXII.`)
}
