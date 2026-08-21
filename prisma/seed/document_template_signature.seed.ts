import type { PrismaClient } from '@prisma/client'

export async function seedDocumentTemplateSignature(db: PrismaClient) {
  console.log('🌱 Seeding document_template_signature (Form-VII 6+6 = 12 Signature Flow)...')

  const signatures = [
    // ════════════════════════════════════════════════════════════════════════════
    // FORM-VII 12-STEP JOINT RECONCILIATION SIGNATURE FLOW (6 Purchasing + 6 Adjacent)
    // ════════════════════════════════════════════════════════════════════════════
    // Section A: Purchasing Colliery / Area (Mine A) - Steps 1 to 6
    {
      template_code: 'FORM_VII',
      sig_permission: 'form_vii.sign.purchasing_land_clerk',
      workflow_state: 'UnitSubmitted',
      placeholders: { placeholder_key: 'PurchasingLandClerkSignature', label: 'Land Clerk/Amin/Rev.Inspector (Purchasing Mine)' },
      is_required: true,
      display_order: 1,
    },
    {
      template_code: 'FORM_VII',
      sig_permission: 'form_vii.sign.purchasing_survey_officer',
      workflow_state: 'UnitSubmitted',
      placeholders: { placeholder_key: 'PurchasingSurveyOfficerSignature', label: 'Surveyor/Survey Officer (Purchasing Mine)' },
      is_required: true,
      display_order: 2,
    },
    {
      template_code: 'FORM_VII',
      sig_permission: 'form_vii.sign.purchasing_project_manager',
      workflow_state: 'UnitSubmitted',
      placeholders: { placeholder_key: 'PurchasingProjectManagerSignature', label: 'Colliery/Project Manager (Purchasing Mine)' },
      is_required: true,
      display_order: 3,
    },
    {
      template_code: 'FORM_VII',
      sig_permission: 'form_vii.sign.purchasing_project_agent',
      workflow_state: 'UnitSubmitted',
      placeholders: { placeholder_key: 'PurchasingProjectAgentSignature', label: 'Colliery/Project Agent (Purchasing Mine)' },
      is_required: true,
      display_order: 4,
    },
    {
      template_code: 'FORM_VII',
      sig_permission: 'form_vii.sign.purchasing_area_land_officer',
      workflow_state: 'UnitSubmitted',
      placeholders: { placeholder_key: 'PurchasingAreaLandOfficerSignature', label: 'Area Land Dealing Officer (Purchasing Area)' },
      is_required: true,
      display_order: 5,
    },
    {
      template_code: 'FORM_VII',
      sig_permission: 'form_vii.sign.purchasing_area_gm',
      workflow_state: 'UnitSubmitted',
      placeholders: { placeholder_key: 'PurchasingAreaGeneralManagerSignature', label: 'Area General Manager (Purchasing Area)' },
      is_required: true,
      display_order: 6,
    },

    // Section B: Adjacent Colliery / Area (Mine B) - Steps 7 to 12
    {
      template_code: 'FORM_VII',
      sig_permission: 'form_vii.sign.adjacent_land_clerk',
      workflow_state: 'CrossCollieryVerification',
      placeholders: { placeholder_key: 'AdjacentLandClerkSignature', label: 'Land Clerk/Amin/Rev.Inspector (Adjacent Mine)' },
      is_required: true,
      display_order: 7,
    },
    {
      template_code: 'FORM_VII',
      sig_permission: 'form_vii.sign.adjacent_survey_officer',
      workflow_state: 'CrossCollieryVerification',
      placeholders: { placeholder_key: 'AdjacentSurveyOfficerSignature', label: 'Surveyor/Survey Officer (Adjacent Mine)' },
      is_required: true,
      display_order: 8,
    },
    {
      template_code: 'FORM_VII',
      sig_permission: 'form_vii.sign.adjacent_project_manager',
      workflow_state: 'CrossCollieryVerification',
      placeholders: { placeholder_key: 'AdjacentProjectManagerSignature', label: 'Colliery/Project Manager (Adjacent Mine)' },
      is_required: true,
      display_order: 9,
    },
    {
      template_code: 'FORM_VII',
      sig_permission: 'form_vii.sign.adjacent_project_agent',
      workflow_state: 'CrossCollieryVerification',
      placeholders: { placeholder_key: 'AdjacentProjectAgentSignature', label: 'Colliery/Project Agent (Adjacent Mine)' },
      is_required: true,
      display_order: 10,
    },
    {
      template_code: 'FORM_VII',
      sig_permission: 'form_vii.sign.adjacent_area_land_officer',
      workflow_state: 'CrossCollieryVerification',
      placeholders: { placeholder_key: 'AdjacentAreaLandOfficerSignature', label: 'Area Land Dealing Officer (Adjacent Area)' },
      is_required: true,
      display_order: 11,
    },
    {
      template_code: 'FORM_VII',
      sig_permission: 'form_vii.sign.adjacent_area_gm',
      workflow_state: 'CrossCollieryVerification',
      placeholders: { placeholder_key: 'AdjacentAreaGeneralManagerSignature', label: 'Area General Manager (Adjacent Area)' },
      is_required: true,
      display_order: 12,
    },

    // ════════════════════════════════════════════════════════════════════════════
    // FORM-XXII LAND CELL CLEARANCE SIGNATURE FLOW
    // ════════════════════════════════════════════════════════════════════════════
    {
      template_code: 'FORM_XXII',
      sig_permission: 'form_xxii.sign.area_land_cell_member',
      workflow_state: 'FormXXIIClearance',
      placeholders: { placeholder_key: 'AreaLandCellMemberSignature', label: 'Area Land Cell Member' },
      is_required: true,
      display_order: 1,
    },
    {
      template_code: 'FORM_XXII',
      sig_permission: 'form_xxii.sign.area_land_officer',
      workflow_state: 'AreaVetting',
      placeholders: { placeholder_key: 'AreaLandOfficerSignature', label: 'Area Land Dealing Officer' },
      is_required: true,
      display_order: 2,
    },
    {
      template_code: 'FORM_XXII',
      sig_permission: 'form_xxii.sign.area_gm',
      workflow_state: 'AreaVetting',
      placeholders: { placeholder_key: 'AreaGeneralManagerSignature', label: 'Area General Manager' },
      is_required: true,
      display_order: 3,
    },

    // ════════════════════════════════════════════════════════════════════════════
    // FORM-XVI FIVE-POINT CERTIFICATE SIGNATURE FLOW
    // ════════════════════════════════════════════════════════════════════════════
    {
      template_code: 'FORM_XVI',
      sig_permission: 'form_xvi.sign.surveyor',
      workflow_state: 'UnitVerification',
      placeholders: { placeholder_key: 'SurveyorSignature', label: 'Surveyor' },
      is_required: true,
      display_order: 1,
    },
    {
      template_code: 'FORM_XVI',
      sig_permission: 'form_xvi.sign.manager',
      workflow_state: 'UnitVerification',
      placeholders: { placeholder_key: 'ManagerSignature', label: 'Manager' },
      is_required: true,
      display_order: 2,
    },
    {
      template_code: 'FORM_XVI',
      sig_permission: 'form_xvi.sign.agent',
      workflow_state: 'UnitVerification',
      placeholders: { placeholder_key: 'ProjectOfficerSignature', label: 'Agent / Project Officer' },
      is_required: true,
      display_order: 3,
    },
  ]

  for (const sig of signatures) {
    const existing = await (db as any).document_template_signature.findFirst({
      where: {
        template_code: sig.template_code,
        sig_permission: sig.sig_permission,
      },
    })

    if (existing) {
      await (db as any).document_template_signature.update({
        where: { id: existing.id },
        data: {
          workflow_state: sig.workflow_state,
          placeholders: sig.placeholders,
          is_required: sig.is_required,
          display_order: sig.display_order,
          updt_ts: new Date(),
        },
      })
    } else {
      await (db as any).document_template_signature.create({
        data: {
          ...sig,
          entry_ts: new Date(),
          updt_ts: new Date(),
        },
      })
    }
  }

  console.log(`✅ Seeded ${signatures.length} document_template_signature rules for Form-VII (6+6=12), Form-XXII, and Form-XVI (3).`)
}
