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

    // 1. Fetch instance and template
    const instance = await db.document_instance.findUnique({ where: { id: instanceId } })
    if (!instance) return badRequest("Instance not found")
    
    // 2. Fetch template fields from document_template_field table
    const fields = await db.document_template_field.findMany({
      where: { template_code: instance.template_code, is_active: true }
    })
    
    // 3. Build dynamic Zod schema with passthrough so custom or unseeded fields are preserved
    let parsedData = formData
    if (fields.length > 0) {
      const schema = createDynamicZodSchema(fields.map((f: any) => ({
        field_key: f.field_key,
        label: f.label,
        field_type: f.field_type,
        is_required: f.is_required,
        show_if: f.show_if ? f.show_if : undefined
      }))).passthrough()
      
      const parseResult = schema.safeParse(formData)
      if (parseResult.success) {
        parsedData = parseResult.data
      }
    }

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
