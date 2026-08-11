import { NextRequest } from 'next/server'
import { authorizeApi } from '@/core/authorization/middleware/authorize'
import { ok, badRequest, serverError, notFound } from '@/app/api/_lib'
import { proposalDocumentPackageService } from '@/infrastructure/di/Container'

type Ctx = { params: Promise<{ id: string, attachmentId: string }> }

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const auth = await authorizeApi('proposal.edit') // Require update permission to delete documents
  if (auth.error) return auth.error

  const { id, attachmentId } = await params

  try {
    const result = await proposalDocumentPackageService.removeDocument(id, attachmentId, auth.user.id)
    
    if (result.isFailure) {
      if (String(result.error).includes('not found')) return notFound('Document not found')
      return badRequest(String(result.error))
    }

    return ok({ success: true })
  } catch (e: any) {
    console.error('DELETE /api/proposals/[id]/documents/[attachmentId] error:', e)
    return serverError('Failed to delete document', e.message)
  }
}
