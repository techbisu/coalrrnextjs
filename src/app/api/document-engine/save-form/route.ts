import { NextResponse, NextRequest } from 'next/server'
import { authorizeApi } from '@/core/authorization/middleware/authorize'
import { ok, serverError, badRequest } from '@/app/api/_lib'
import { saveDocumentFormUseCase } from '@/infrastructure/di/Container'
import { db } from '@/lib/db'
import { createDynamicZodSchema } from '@/modules/document-engine/application/utils/validation'

export async function POST(req: NextRequest) {
  const auth = await authorizeApi('project.view')
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { instanceId, formData } = body
    
    if (!instanceId || !formData) {
      return badRequest('instanceId and formData are required')
    }

    // 1. Fetch instance and template for schema metadata
    const instance = await db.document_instance.findUnique({ where: { id: instanceId } })
    if (!instance) return badRequest("Instance not found")
    
    const template = await db.document_template.findUnique({ where: { template_code: instance.template_code } })
    if (!template) return badRequest("Template not found")
    
    // 2. Build the Zod schema dynamically on the server
    const schema = createDynamicZodSchema((template.config as any)?.fields as any[] || [])
    
    // 3. Validate and parse the incoming payload
    const parsedData = schema.parse(formData)

    const result = await saveDocumentFormUseCase.execute({ 
      instanceId, 
      formData: parsedData,
      userId: auth.user.id
    })

    if (result.isFailure) {
      return serverError(result.error as string)
    }

    return ok({ success: true })
  } catch (error: any) {
    console.error('Error saving form data:', error)
    return serverError('Failed to save form data', error.message)
  }
}
