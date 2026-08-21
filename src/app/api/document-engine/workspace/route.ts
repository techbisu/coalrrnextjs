import { NextResponse, NextRequest } from 'next/server'
import { authorizeApi } from '@/core/authorization/middleware/authorize'
import { ok, serverError, badRequest } from '@/app/api/_lib'
import { startDocumentWorkspaceUseCase } from '@/infrastructure/di/Container'
import { db } from '@/lib/db'

// Recompile trigger: 2026-08-05T16:53:30Z

export async function POST(req: NextRequest) {
  // 1. Auth check
  const auth = await authorizeApi('project.view') // General access, specific checks can be added
  if ('error' in auth) {
    return auth.error
  }

  try {
    const body = await req.json()
    const { templateCode, applicationId, extraData } = body
    
    if (!templateCode || !applicationId) {
      return badRequest('templateCode and applicationId are required')
    }

    const result = await startDocumentWorkspaceUseCase.execute({
      templateCode,
      applicationId,
      extraData: extraData || {},
      userId: auth.user.id
    })

    if (result.isFailure) {
      return serverError(result.error as string)
    }
    
    const instance = result.value

    // Fetch the template fields from document_template_field table
    let fields = await db.document_template_field.findMany({
      where: { template_code: templateCode, is_active: true },
      orderBy: { display_order: 'asc' }
    });

    let parsedFields = fields.map((f: any) => ({
      id: f.id,
      field_key: f.field_key,
      field_type: f.field_type,
      label: f.label,
      options: f.options ? f.options : undefined,
      show_if: f.show_if ? f.show_if : undefined,
      is_required: f.is_required,
      display_order: f.display_order
    }));

    // Fetch master dropdown lists for Adjacent Colliery & Area
    const [mines, areas] = await Promise.all([
      db.mine.findMany({
        where: { is_active: true },
        select: { mine_cd: true, mine_en: true },
        orderBy: { mine_en: 'asc' }
      }),
      db.area.findMany({
        where: { is_active: true },
        select: { area_cd: true, area_en: true },
        orderBy: { area_en: 'asc' }
      })
    ]);

    const mineOptions = mines.map((m: any) => m.mine_en || m.mine_cd).filter(Boolean);
    const areaOptions = areas.map((a: any) => a.area_en || a.area_cd).filter(Boolean);

    // Fallback default form fields if not yet seeded in document_template_field
    if (parsedFields.length === 0 && templateCode === 'FORM_VII') {
      parsedFields = [
        { id: 'f7_1', field_key: 'AdjacentCollieryName', field_type: 'select', label: 'Adjacent Colliery Name (Sharing Common Boundary)', options: mineOptions, show_if: null, is_required: true, display_order: 1 },
        { id: 'f7_2', field_key: 'AdjacentAreaName', field_type: 'select', label: 'Adjacent Area Name', options: areaOptions, show_if: null, is_required: false, display_order: 2 }
      ];
    } else if (parsedFields.length === 0 && templateCode === 'FORM_XXII') {
      parsedFields = [
        { id: 'f22_1', field_key: 'SchemeApprovalRef', field_type: 'text', label: 'Reference of Project / Scheme Approval', options: null, show_if: null, is_required: false, display_order: 1 },
        { id: 'f22_2', field_key: 'CompensationRate', field_type: 'text', label: 'Rate of Proposed Land Compensation', options: null, show_if: null, is_required: false, display_order: 2 },
        { id: 'f22_3', field_key: 'RelaxationRequired', field_type: 'text', label: 'Details of R&R Relaxation Required (if any)', options: null, show_if: null, is_required: false, display_order: 3 },
        { id: 'f22_4', field_key: 'MeetingsHeld', field_type: 'text', label: 'Meetings with Landowners / Villagers Held?', options: null, show_if: null, is_required: false, display_order: 4 },
        { id: 'f22_5', field_key: 'LandownersReady', field_type: 'text', label: 'Landowners Ready to Accept Proposed Rate?', options: null, show_if: null, is_required: false, display_order: 5 }
      ];
    } else if (parsedFields.length === 0 && templateCode === 'FORM_II') {
      parsedFields = [
        { id: 'f2_3', field_key: 'PurposeOfPossession', field_type: 'text', label: '3. *The purpose for which the land is to be taken in possession', options: null, show_if: null, is_required: true, display_order: 1 },
        { id: 'f2_4', field_key: 'OwnershipBeforeUse', field_type: 'select', label: '4. *Whether the Date of ownership gained by the concerned landowner is prior to the date of use of the same by the Company?', options: ['Yes', 'No'], show_if: null, is_required: true, display_order: 2 },
        { id: 'f2_5', field_key: 'WithinApprovedWorkingArea', field_type: 'select', label: '5. *Whether the said lands lie in/ over the authorized working area/ approved Project Area?', options: ['Yes', 'No'], show_if: null, is_required: true, display_order: 3 },
        { id: 'f2_6', field_key: 'CompetentApprovalStatus', field_type: 'select', label: '6. *Whether the said lands are included in schedule of land approved by Competent Authority of the Company?', options: ['Yes', 'No'], show_if: null, is_required: true, display_order: 4 },
        { id: 'f2_6_doc', field_key: 'CompetentApprovalDocId', field_type: 'file', label: '6(a). *Attach Approval Copy (Browse File):', options: null, show_if: { CompetentApprovalStatus: { '$eq': 'Yes' } }, is_required: true, display_order: 5 },
        { id: 'f2_6_ref', field_key: 'CompetentApprovalRefNo', field_type: 'text', label: '6(b). *If Yes, enter Approval Reference Number:', options: null, show_if: { CompetentApprovalStatus: { '$eq': 'Yes' } }, is_required: true, display_order: 6 },
        { id: 'f2_7', field_key: 'PreviouslyAcquiredStatus', field_type: 'select', label: '7. *Whether the said land has never been acquired/purchased by ECL before or it belongs to ECL by any means:', options: ['Yes', 'No'], show_if: null, is_required: true, display_order: 7 },
        { id: 'f2_8', field_key: 'ErstwhileManagementStatus', field_type: 'select', label: '8. *Whether the said lands was/were acquired/purchased by erstwhile management before Nationalization of mine:', options: ['Yes', 'No'], show_if: null, is_required: true, display_order: 8 },
        { id: 'f2_9', field_key: 'PreNationalizationDamageStatus', field_type: 'select', label: '9. *Whether the said lands have been affected/damaged before nationalization:', options: ['Yes', 'No'], show_if: null, is_required: true, display_order: 9 },
        { id: 'f2_10', field_key: 'GovernmentLandStatus', field_type: 'select', label: '10. *Whether the said lands are vested in the State Govt/ Forest Department or any other Govt. entity:', options: ['Yes', 'No'], show_if: null, is_required: true, display_order: 10 },
        { id: 'f2_11', field_key: 'PreviousCompensationStatus', field_type: 'select', label: '11. *Whether any compensation or benefit has been provided earlier against the scheduled land:', options: ['Yes', 'No'], show_if: null, is_required: true, display_order: 11 },
        { id: 'f2_12', field_key: 'MasterPlanStatus', field_type: 'select', label: '12. *Whether these plots are included in ‘Raniganj Master Plan’ or any such prevalent plan approved by the Central/ State Government:', options: ['Yes', 'No'], show_if: null, is_required: true, display_order: 12 },
        { id: 'f2_13', field_key: 'RevenuePlanAttachment', field_type: 'select', label: '13. *A revenue plan showing scheduled plots, year wise program of use mentioning purpose is attached:', options: ['Yes', 'No'], show_if: null, is_required: true, display_order: 13 },
        { id: 'f2_13_doc', field_key: 'RevenuePlanDocId', field_type: 'file', label: '13(a). *Attach Revenue Plan Map / Drawing (Browse File):', options: null, show_if: { RevenuePlanAttachment: { '$eq': 'Yes' } }, is_required: true, display_order: 14 }
      ];
    } else {
      // Inject dynamic options for AdjacentCollieryName & AdjacentAreaName if present
      parsedFields = parsedFields.map((f: any) => {
        if (f.field_key === 'AdjacentCollieryName') {
          return { ...f, field_type: 'select', options: mineOptions.length > 0 ? mineOptions : f.options };
        }
        if (f.field_key === 'AdjacentAreaName') {
          return { ...f, field_type: 'select', options: areaOptions.length > 0 ? areaOptions : f.options };
        }
        return f;
      });
    }

    // Fetch signature rules for template via Prisma ORM
    let sigRules = await db.document_template_signature.findMany({
      where: { template_code: templateCode },
      orderBy: { display_order: 'asc' }
    });

    if ((!sigRules || sigRules.length === 0) && templateCode === 'FORM_II') {
      const defaultFormIISigs = [
        {
          template_code: 'FORM_II',
          sig_permission: 'form_ii.sign.land_clerk',
          workflow_state: 'VerificationPending',
          placeholders: { placeholder_key: 'LandClerkSignature', label: 'Land Clerk / Amin / Rev.Inspector' },
          is_required: true,
          display_order: 1,
        },
        {
          template_code: 'FORM_II',
          sig_permission: 'form_ii.sign.survey_officer',
          workflow_state: 'VerificationPending',
          placeholders: { placeholder_key: 'SurveyOfficerSignature', label: 'Surveyor / Survey Officer' },
          is_required: true,
          display_order: 2,
        },
        {
          template_code: 'FORM_II',
          sig_permission: 'form_ii.sign.manager',
          workflow_state: 'VerificationPending',
          placeholders: { placeholder_key: 'ManagerSignature', label: 'Colliery / Project Manager' },
          is_required: true,
          display_order: 3,
        },
        {
          template_code: 'FORM_II',
          sig_permission: 'form_ii.sign.project_officer',
          workflow_state: 'VerificationPending',
          placeholders: { placeholder_key: 'ProjectOfficerSignature', label: 'Project Officer / Agent' },
          is_required: true,
          display_order: 4,
        },
      ];

      for (const sig of defaultFormIISigs) {
        await db.document_template_signature.create({
          data: {
            ...sig,
            entry_ts: new Date(),
            updt_ts: new Date(),
          }
        }).catch(console.error);
      }

      sigRules = await db.document_template_signature.findMany({
        where: { template_code: templateCode },
        orderBy: { display_order: 'asc' }
      });
    }

    const pendingSignatures = (sigRules || []).map((s: any) => ({
      id: s.id,
      sig_permission: s.sig_permission || s.role,
      role: s.sig_permission || s.role,
      workflow_state: s.workflow_state,
      is_required: s.is_required,
      placeholders: s.placeholders
    }));

    let activeGeneratedFileId: string | null = null
    if (instance.generated_docx_path) {
      const activeFile = await db.file_record.findFirst({
        where: {
          id: instance.generated_docx_path,
          is_active: true
        }
      })
      if (activeFile) {
        activeGeneratedFileId = instance.generated_docx_path
      }
    }

    return ok({
      success: true,
      instance: {
        id: instance.id,
        generated_docx_path: activeGeneratedFileId,
        form_data: instance.form_data ?? {},
        signature_data: instance.signature_data_json ?? []
      },
      fields: parsedFields,
      signatures: pendingSignatures,
      userRoles: auth.user.roles || [],
      userPermissions: auth.user.permissions || [],
      userEmail: auth.user.email,
      userName: auth.user.name
    })
  } catch (error: any) {
    console.error('Error starting workspace:', error)
    return serverError('Failed to start document workspace', error.message)
  }
}
