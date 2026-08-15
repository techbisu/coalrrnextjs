import { NextResponse, NextRequest } from 'next/server'
import { authorizeApi } from '@/core/authorization/middleware/authorize'
import { ok, serverError, badRequest } from '@/app/api/_lib'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const auth = await authorizeApi('project.view')
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { instanceId, role: providedRole, sig_permission, signatureText } = body
    const targetPerm = sig_permission || providedRole
    
    if (!instanceId || !targetPerm || !signatureText) {
      return badRequest('instanceId, sig_permission (or role), and signatureText are required')
    }

    const instance = await db.document_instance.findUnique({ where: { id: instanceId } })
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

    // 2. Sequential Step Validation
    const sigRules = Array.isArray(instance.resolver_signatures_json)
      ? (instance.resolver_signatures_json as any[])
      : []
    const sortedRules = [...sigRules].sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
    const existingSigs = Array.isArray(instance.signature_data_json) ? (instance.signature_data_json as any[]) : []

    const targetRuleIndex = sortedRules.findIndex(r => (r.sig_permission || r.role) === targetPerm)
    if (targetRuleIndex > 0) {
      for (let k = 0; k < targetRuleIndex; k++) {
        const prev = sortedRules[k]
        const prevPerm = prev.sig_permission || prev.role
        if (prev.is_required && !existingSigs.some(s => (s.sig_permission || s.role) === prevPerm)) {
          return badRequest(`Sequential error: Step ${k + 1} (${prevPerm}) must be signed before step ${targetRuleIndex + 1}`)
        }
      }
    }

    const updatedSigs = [
      ...existingSigs.filter((s: any) => (s.sig_permission || s.role) !== targetPerm),
      {
        role: targetPerm,
        sig_permission: targetPerm,
        signatureText,
        signedAt: new Date().toISOString(),
        userId: auth.user.id,
        userName: auth.user.name || auth.user.email
      }
    ]

    await db.document_instance.update({
      where: { id: instanceId },
      data: {
        signature_data_json: updatedSigs,
        status: 'QUEUED',
      }
    })

    // Queue background generation job via JobDispatcherService
    try {
      const { jobDispatcher } = await import('@/infrastructure/di/Container')
      await jobDispatcher.dispatch('generateDocument', { instanceId })
    } catch (dispatchErr: any) {
      console.error(`[POST /api/document-engine/sign] Dispatch failed for ${instanceId}:`, dispatchErr)
      await db.document_instance.updateMany({
        where: { id: instanceId, status: 'QUEUED' },
        data: { status: 'DRAFT' },
      })
      throw dispatchErr
    }

    return ok({ success: true, status: 'QUEUED', signatures: updatedSigs })
  } catch (error: any) {
    console.error('Error signing document:', error)
    return serverError('Failed to apply signature to document', error.message)
  }
}
