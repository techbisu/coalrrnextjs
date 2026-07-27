import { NextResponse, NextRequest } from 'next/server'
import { authorizeApi } from '@/core/authorization/middleware/authorize'
import { ok, serverError, badRequest } from '@/app/api/_lib'
import { startDocumentWorkspaceUseCase } from '@/infrastructure/di/Container'
import { db } from '@/lib/db'

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

    // Fetch the template to get the fields back to the UI
    const template = await db.document_template.findUnique({
      where: { template_code: templateCode }
    })

    if (!template) {
      return serverError(`Template not found: ${templateCode}`)
    }

    const fields = (template.config as any)?.fields;
    const parsedFields = Array.isArray(fields) ? fields.map((f: any) => ({
      ...f,
      options: f.options ? f.options : undefined
    })) : []

    return ok({
      success: true,
      instance: {
        id: instance.id,
        generated_docx_path: instance.generated_docx_path
      },
      fields: parsedFields
    })
  } catch (error: any) {
    console.error('Error starting workspace:', error)
    return serverError('Failed to start document workspace', error.message)
  }
}
