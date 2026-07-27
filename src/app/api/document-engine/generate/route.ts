import { NextResponse, NextRequest } from 'next/server'
import { authorizeApi } from '@/core/authorization/middleware/authorize'
import { ok, serverError, badRequest } from '@/app/api/_lib'
import { generateDocumentUseCase } from '@/infrastructure/di/Container'

export async function POST(req: NextRequest) {
  const auth = await authorizeApi('project.view')
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { instanceId } = body
    
    if (!instanceId) {
      return badRequest('instanceId is required')
    }

    const result = await generateDocumentUseCase.execute({ instanceId })

    if (result.isFailure) {
      return serverError(result.error as string)
    }

    return ok({ success: true, fileId: result.value.fileId })
  } catch (error: any) {
    console.error('Error generating document:', error)
    return serverError('Failed to generate document', error.message)
  }
}
