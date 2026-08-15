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
    return NextResponse.json({ error: auth.error }, { status: 403 })
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
    const sigRules = await db.document_template_signature.findMany({
      where: { template_code: templateCode },
      orderBy: { display_order: 'asc' }
    });

    const pendingSignatures = (sigRules || []).map((s: any) => ({
      id: s.id,
      sig_permission: s.sig_permission || s.role,
      role: s.sig_permission || s.role,
      workflow_state: s.workflow_state,
      is_required: s.is_required,
      placeholders: s.placeholders
    }));

    return ok({
      success: true,
      instance: {
        id: instance.id,
        generated_docx_path: instance.generated_docx_path,
        form_data: instance.form_data ?? {},
        signature_data: instance.signature_data_json ?? [],
        review_data: (instance as any).review_data_json ?? []
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
