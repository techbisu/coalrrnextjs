import { NextResponse, NextRequest } from 'next/server'
import { authorizeApi } from '@/core/authorization/middleware/authorize'
import { ok, serverError, badRequest } from '@/app/api/_lib'
import { generateDocumentUseCase } from '@/infrastructure/di/Container'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const auth = await authorizeApi('project.view')
  if ('error' in auth) {
    return auth.error
  }

  try {
    const body = await req.json()
    const { instanceId } = body
    
    if (!instanceId) {
      return badRequest('instanceId is required')
    }

    // 1. Reset instance status to GENERATING to allow regeneration
    await db.document_instance.update({
      where: { id: instanceId },
      data: { status: 'GENERATING' }
    })

    // 2. Execute document generation synchronously for instant workspace update
    const genResult = await generateDocumentUseCase.execute({ instanceId })

    if (genResult.isFailure) {
      await db.document_instance.update({
        where: { id: instanceId },
        data: { status: 'FAILED' }
      })
      return serverError('Failed to generate document: ' + genResult.error)
    }

    // 3. Mark status as DRAFT / COMPLETED and fetch latest instance state
    await db.document_instance.update({
      where: { id: instanceId },
      data: { status: 'DRAFT' }
    })

    const updated = await db.document_instance.findUnique({ where: { id: instanceId } })

    return ok({
      success: true,
      instanceId,
      fileId: updated?.generated_docx_path || genResult.value?.fileId || null,
      status: updated?.status || 'DRAFT'
    })
  } catch (error: any) {
    console.error('Error in POST /api/document-engine/generate:', error)
    return serverError('Failed to generate document', error.message)
  }
}
