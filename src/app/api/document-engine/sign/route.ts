import { NextResponse, NextRequest } from 'next/server'
import { authorizeApi } from '@/core/authorization/middleware/authorize'
import { ok, serverError, badRequest } from '@/app/api/_lib'
import { generateDocumentUseCase } from '@/infrastructure/di/Container'
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

    const existingSigs = Array.isArray(instance.signature_data_json) ? instance.signature_data_json : []
    const updatedSigs = [
      ...(existingSigs as any[]).filter((s: any) => (s.sig_permission || s.role) !== targetPerm),
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
      data: { signature_data_json: updatedSigs }
    })

    // Regenerate document with new signature injected
    const genResult = await generateDocumentUseCase.execute({ instanceId })

    if (genResult.isFailure) {
      return serverError(genResult.error as string)
    }

    return ok({ success: true, fileId: genResult.value.fileId, signatures: updatedSigs })
  } catch (error: any) {
    console.error('Error signing document:', error)
    return serverError('Failed to apply signature to document', error.message)
  }
}
