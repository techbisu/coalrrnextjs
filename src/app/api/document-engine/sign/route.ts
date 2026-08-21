import { NextResponse, NextRequest } from 'next/server'
import { authorizeApi } from '@/core/authorization/middleware/authorize'
import { ok, serverError, badRequest } from '@/app/api/_lib'
import { Container } from '@/infrastructure/di/Container'
import { workflowTargetResolverRegistry } from '@/core/workflow/resolvers/WorkflowTargetResolverRegistry'
import { MODULE_CODES, CHECKABLE_ENTITY_TYPES } from '@/core/config/module-codes.config'

export async function POST(req: NextRequest) {
  const auth = await authorizeApi([
    'document.sign',
    'proposal.sign',
    'proposal.view',
    'acquisition.view',
    'project.view',
  ])
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: 403 })
  }

  try {
    const body = await req.json()
    const {
      instanceId,
      role: providedRole,
      sig_permission,
      signatureText,
      moduleCode,
      entityType,
    } = body
    const targetPerm = sig_permission || providedRole
    
    if (!instanceId || !targetPerm || !signatureText) {
      return badRequest('instanceId, sig_permission (or role), and signatureText are required')
    }

    const instance = await Container.documentInstanceRepository.findById(instanceId)
    if (!instance) return badRequest('Document instance not found')

    // 1. Server-side Permission Validation (Strict Security Guard)
    const userPerms = auth.user.permissions || []
    const userRoles = auth.user.roles || []

    const isAuthorized =
      userPerms.includes(targetPerm) ||
      userPerms.includes('document.sign') ||
      userPerms.includes('*') ||
      userRoles.some((r: string) => {
        const rl = r.toLowerCase().replace(/[^a-z0-9]/g, '')
        return rl.includes('admin') || rl.includes('super')
      })

    if (!isAuthorized) {
      return NextResponse.json({ error: `Forbidden: Missing signature permission ${targetPerm}` }, { status: 403 })
    }

    // 2. Resolve current workflow state for the entity (generic — uses moduleCode + entityType from caller)
    const currentState = await resolveCurrentWorkflowState(
      moduleCode || MODULE_CODES.LAND_SCHEDULE,
      entityType || CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE,
      instance.application_id
    )

    // 3. Resolve signature rules from the AUTHORITATIVE document_template_signature table
    //    (not from the stale resolver_signatures_json stored on the instance)
    const sigReq = await Container.documentSignatureRequirementResolver.resolve(
      instance.template_code,
      instance.signature_data_json,
      currentState
    )

    if (!sigReq.hasSignatureRules) {
      return badRequest('No signature rules configured for this document template')
    }

    const sortedRules = [...sigReq.allRules].sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
    const existingSigs = Array.isArray(instance.signature_data_json) ? (instance.signature_data_json as any[]) : []

    // 4. Validate that the requested signature is actually required for the current workflow state
    const isRequiredForCurrentState = sigReq.currentStageRequiredRules.some(
      rule => rule.sig_permission === targetPerm
    )
    if (!isRequiredForCurrentState && !sigReq.fullyCompleted) {
      return badRequest(`Signature '${targetPerm}' is not required for the current workflow state`)
    }

    // 5. Sequential Step Validation — enforce display_order ordering
    const targetRuleIndex = sortedRules.findIndex(r => r.sig_permission === targetPerm)
    if (targetRuleIndex > 0) {
      for (let k = 0; k < targetRuleIndex; k++) {
        const prev = sortedRules[k]
        if (prev.is_required && !existingSigs.some(s => s.sig_permission === prev.sig_permission)) {
          return badRequest(`Sequential error: Step ${k + 1} (${prev.sig_permission}) must be signed before step ${targetRuleIndex + 1}`)
        }
      }
    }

    const userName = auth.user.name || auth.user.email || 'Authorized Signee'
    const designation = auth.user.designation || (auth.user.roles?.[0] ? auth.user.roles[0].replace(/_/g, ' ') : 'Officer')
    const signedAtIso = new Date().toISOString()
    const formattedSignatureText = `Digitally Signed By\n${userName}\n${designation}, ECL\n${signedAtIso}`

    const updatedSigs = [
      ...existingSigs.filter((s: any) => s.sig_permission !== targetPerm),
      {
        role: targetPerm,
        sig_permission: targetPerm,
        signatureText: formattedSignatureText,
        signedAt: signedAtIso,
        userId: auth.user.id,
        userName,
        userDesignation: designation,
      }
    ]

    await Container.documentInstanceRepository.update(instanceId, {
      signature_data_json: updatedSigs,
      status: 'QUEUED',
    } as any)

    // Queue background generation job via JobDispatcherService
    try {
      await Container.jobDispatcher.dispatch('generateDocument', { instanceId })
    } catch (dispatchErr: any) {
      console.error(`[POST /api/document-engine/sign] Dispatch failed for ${instanceId}:`, dispatchErr)
      await Container.documentInstanceRepository.update(instanceId, { status: 'DRAFT' } as any)
      throw dispatchErr
    }

    return ok({ success: true, status: 'QUEUED', signatures: updatedSigs })
  } catch (error: any) {
    console.error('Error signing document:', error)
    return serverError('Failed to apply signature to document', error.message)
  }
}

/**
 * Resolve the current workflow state for an entity.
 * Uses the generic workflowTargetResolverRegistry — no module-specific logic.
 * Falls back to 'Drafting' if resolution fails.
 */
async function resolveCurrentWorkflowState(
  moduleCode: string,
  entityType: string,
  applicationId: string
): Promise<string> {
  try {
    const status = await workflowTargetResolverRegistry.resolveStatus(
      moduleCode,
      entityType,
      applicationId
    )
    return status?.currentStateCode || 'Drafting'
  } catch {
    return 'Drafting'
  }
}
