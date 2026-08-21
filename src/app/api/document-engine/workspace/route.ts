import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { authorizeApi } from '@/core/authorization/middleware/authorize';
import { MODULE_CODES, CHECKABLE_ENTITY_TYPES } from '@/core/config/module-codes.config';

async function handleWorkspaceRequest(
  templateCode: string | null,
  applicationId: string | null,
  scheduleId: string | null,
  user: any,
  contextId: string | null | undefined = null
) {
  if (!templateCode) {
    return NextResponse.json({ error: 'templateCode parameter is required' }, { status: 400 });
  }

  // 1. Fetch document template
  const template = await (db as any).document_template.findFirst({
    where: {
      template_code: {
        in: [templateCode, templateCode.toUpperCase(), templateCode.toLowerCase()],
      },
    },
  });

  if (!template) {
    return NextResponse.json({ error: `Document template '${templateCode}' not found` }, { status: 404 });
  }

  // 2. Fetch or initialize document instance
  const effectiveAppId = applicationId || scheduleId || 'default-draft-app';
  let instance = await (db as any).document_instance.findFirst({
    where: {
      template_code: template.template_code,
      application_id: effectiveAppId,
      context_id: contextId || null
    },
  });

  if (!instance) {
    // Auto-create instance if not existing
    instance = await (db as any).document_instance.create({
      data: {
        id: randomUUID(),
        template_code: template.template_code,
        application_id: effectiveAppId,
        status: 'DRAFT',
        form_data: {},
        signature_data_json: [],
        review_data_json: [],
        final_fields_json: {},
        context_id: contextId || null,
        context_type: contextId ? 'proposal' : null,
        entry_ts: new Date(),
        updt_ts: new Date(),
      },
    });
  }

  // 3. Fetch template fields
  const fields = await (db as any).document_template_field.findMany({
    where: { template_code: template.template_code, is_active: true },
    orderBy: { display_order: 'asc' },
  });

  let parsedFields = fields.map((f: any) => ({
    ...f,
    options: f.options_json ? f.options_json : undefined,
  }));

  // Fetch dynamic options (collieries / areas)
  const [mines, areas] = await Promise.all([
    (db as any).mine.findMany({
      select: { mine_cd: true, mine_en: true },
      where: { is_active: true },
    }).catch(() => []),
    (db as any).area.findMany({
      select: { area_cd: true, area_en: true },
      where: { is_active: true },
    }).catch(() => []),
  ]);

  const mineOptions = mines.map((m: any) => ({ label: `${m.mine_en} (${m.mine_cd})`, value: m.mine_en }));
  const areaOptions = areas.map((a: any) => ({ label: `${a.area_en} (${a.area_cd})`, value: a.area_en }));

  parsedFields = parsedFields.map((f: any) => {
    if (f.field_key === 'AdjacentCollieryName') {
      return { ...f, field_type: 'select', options: mineOptions.length > 0 ? mineOptions : f.options };
    }
    if (f.field_key === 'AdjacentAreaName') {
      return { ...f, field_type: 'select', options: areaOptions.length > 0 ? areaOptions : f.options };
    }
    return f;
  });

  // 4. Fetch & Deduplicate signature rules for template
  const rawSigRules = await (db as any).document_template_signature.findMany({
    where: {
      template_code: {
        in: [template.template_code, templateCode, templateCode.toUpperCase(), templateCode.toLowerCase()],
      },
      is_required: true,
    },
    orderBy: { display_order: 'asc' },
  });

  const seenPerms = new Set<string>();
  const sigRules: typeof rawSigRules = [];
  for (const rule of rawSigRules) {
    const permKey = rule.sig_permission ? String(rule.sig_permission).trim().toLowerCase() : '';
    if (permKey && !seenPerms.has(permKey)) {
      seenPerms.add(permKey);
      sigRules.push(rule);
    }
  }

  const pendingSignatures = (sigRules || []).map((s: any) => ({
    id: s.id,
    sig_permission: s.sig_permission || s.role,
    role: s.sig_permission || s.role,
    workflow_state: s.workflow_state,
    is_required: s.is_required,
    placeholders: s.placeholders,
  }));

  // 5. Resolve current workflow state
  let currentState = 'Drafting';
  try {
    const { workflowTargetResolverRegistry } = await import('@/core/workflow/resolvers/WorkflowTargetResolverRegistry');
    const targetStatus = await workflowTargetResolverRegistry.resolveStatus(
      MODULE_CODES.LAND_SCHEDULE,
      CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE,
      effectiveAppId
    );
    if (targetStatus?.currentStateCode) {
      currentState = targetStatus.currentStateCode;
    }
  } catch (err) {
    console.warn('[WorkspaceRoute] Could not resolve current workflow state:', err);
  }

  return NextResponse.json({
    success: true,
    currentState,
    instance: {
      id: instance.id,
      template_code: instance.template_code,
      application_id: instance.application_id,
      generated_docx_path: instance.generated_docx_path || null,
      form_data: instance.form_data || {},
      signature_data_json: instance.signature_data_json || [],
      signature_data: instance.signature_data_json || [],
      review_data: instance.review_data_json || [],
    },
    template: {
      template_code: template.template_code,
      template_name: template.template_name,
      description: template.description,
      fields: parsedFields,
      signatureRules: pendingSignatures,
    },
    fields: parsedFields,
    signatures: pendingSignatures,
    userRoles: user?.roles || [],
    userPermissions: user?.permissions || [],
    userName: user?.name || 'Authorized Signee',
  });
}

export async function GET(req: NextRequest) {
  try {
    const auth = await authorizeApi('project.view');
    if ('error' in auth) {
      return auth.error;
    }

    const { searchParams } = new URL(req.url);
    const templateCode = searchParams.get('templateCode');
    const applicationId = searchParams.get('applicationId');
    const scheduleId = searchParams.get('scheduleId');
    const contextId = searchParams.get('contextId');

    return await handleWorkspaceRequest(templateCode, applicationId, scheduleId, auth.user, contextId);
  } catch (err: any) {
    console.error('[DocumentWorkspaceAPI GET] Error fetching workspace:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch document workspace' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authorizeApi('project.view');
    if ('error' in auth) {
      return auth.error;
    }

    const { searchParams } = new URL(req.url);
    const body = await req.json().catch(() => ({}));

    const templateCode = body.templateCode || searchParams.get('templateCode');
    const applicationId = body.applicationId || searchParams.get('applicationId');
    const scheduleId = body.scheduleId || searchParams.get('scheduleId');
    const contextId = body.contextId || searchParams.get('contextId');

    return await handleWorkspaceRequest(templateCode, applicationId, scheduleId, auth.user, contextId);
  } catch (err: any) {
    console.error('[DocumentWorkspaceAPI POST] Error fetching workspace:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch document workspace' }, { status: 500 });
  }
}
