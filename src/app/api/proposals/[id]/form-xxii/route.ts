import { NextResponse, NextRequest } from 'next/server'
import { authorizeApi } from '@/core/authorization/middleware/authorize'
import { ok, badRequest, notFound, serverError } from '@/app/api/_lib'
import { DocumentEngine } from '@/lib/document-engine'
import { db } from '@/lib/db'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Ctx) {
  const auth = await authorizeApi('acquisition.view')
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: 403 })
  }

  const { id } = await params

  try {
    const result = await DocumentEngine.generate({
      template_code: 'FORM_XXII',
      entity_type: 'PROPOSAL',
      entity_id: id,
      generated_by: auth.user.id,
      businessData: {},
    })

    return ok({ message: 'Form-XXII generation started', result })
  } catch (error: any) {
    console.error('Failed to generate Form-XXII:', error)
    return serverError('Failed to generate Form-XXII', error.message)
  }
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const auth = await authorizeApi('acquisition.view')
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: 403 })
  }

  const { id } = await params

  try {
    const template = await db.document_template.findUnique({
      where: { template_code: 'FORM_XXII' }
    })

    if (!template) {
      return ok({ exists: false })
    }

    const instance = await db.document_instance.findFirst({
      where: { template_code: 'FORM_XXII', application_id: id }
    })

    // Load the signed document attachment linked to this proposal
    const attachment = await db.file_attachment.findFirst({
      where: { entity_type: 'land_schedule', entity_id: id },
      include: {
        file_record: {
          include: { file_version: { orderBy: { version_number: 'desc' }, take: 1 } }
        }
      },
      orderBy: { entry_ts: 'desc' }
    })

    // Load the proposal to get its project and updated limits
    const proposal = await db.land_schedule.findUnique({
      where: { id },
      include: {
        mst_project: {
          select: {
            id: true,
            name: true,
            total_land_limit_acres: true,
            total_budget_ceiling: true,
            total_employment_quota: true,
          }
        }
      }
    })

    const fileInfo = attachment ? {
      file_id: attachment.file_id,
      original_name: attachment.file_record.original_name,
      attached_at: attachment.entry_ts,
      attached_by: attachment.attached_by,
      mime_type: attachment.file_record.file_version[0]?.mime_type ?? null,
      size_bytes: attachment.file_record.file_version[0]?.size_bytes?.toString() ?? null,
    } : null

    const projectLimits = proposal?.mst_project ? {
      project_id: proposal.mst_project.id,
      project_name: proposal.mst_project.name,
      total_land_limit_acres: proposal.mst_project.total_land_limit_acres?.toString(),
      total_budget_ceiling: proposal.mst_project.total_budget_ceiling?.toString(),
      total_employment_quota: proposal.mst_project.total_employment_quota,
    } : null

    if (instance) {
      return ok({
        exists: true,
        status: instance.status,
        instance_id: instance.id,
        file: fileInfo,
        project_limits: projectLimits,
      })
    }

    // Template exists but no instance yet — still return file/limits if board-approved
    return ok({
      exists: false,
      file: fileInfo,
      project_limits: projectLimits,
    })
  } catch (error: any) {
    console.error('Failed to get Form-XXII status:', error)
    return serverError('Failed to get Form-XXII status', error.message)
  }
}
