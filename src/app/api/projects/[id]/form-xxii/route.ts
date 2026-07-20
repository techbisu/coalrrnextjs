import { NextRequest } from 'next/server'
import { authorizeApi } from '@/core/authorization/middleware/authorize'
import { ok, serverError } from '@/app/api/_lib'
import { db } from '@/lib/db'

type Ctx = { params: Promise<{ id: string }> }

/**
 * GET /api/projects/[id]/form-xxii
 * Returns all Form-XXII board deviation approvals linked to proposals under this project.
 */
export async function GET(req: NextRequest, { params }: Ctx) {
  const auth = await authorizeApi('project.view')
  if ('error' in auth) return auth.error

  const { id: project_id } = await params

  try {
    // Get all proposals (land_schedules) under this project
    const proposals = await db.land_schedule.findMany({
      where: { project_id },
      select: { id: true, schedule_code: true, proposal_title: true, state: true }
    })

    if (proposals.length === 0) return ok({ approvals: [] })

    const proposalIds = proposals.map(p => p.id)

    // Get all file attachments linked to these proposals (board-approved docs)
    const attachments = await db.file_attachment.findMany({
      where: { entity_type: 'land_schedule', entity_id: { in: proposalIds } },
      include: {
        file_record: {
          include: { file_version: { orderBy: { version_number: 'desc' }, take: 1 } }
        }
      },
      orderBy: { entry_ts: 'desc' }
    })

    // Get all Form-XXII document instances for these proposals
    const instances = await db.document_instance.findMany({
      where: { template_code: 'FORM_XXII', application_id: { in: proposalIds } }
    })

    const instanceByProposal = new Map(instances.map(i => [i.application_id, i]))
    const attachmentByProposal = new Map(attachments.map(a => [a.entity_id, a]))

    // Only include proposals that have a Form-XXII attachment or instance
    const approvals = proposals
      .filter(p => attachmentByProposal.has(p.id) || instanceByProposal.has(p.id))
      .map(p => {
        const attachment = attachmentByProposal.get(p.id)
        const instance = instanceByProposal.get(p.id)
        return {
          proposal_id: p.id,
          schedule_code: p.schedule_code,
          proposal_title: p.proposal_title,
          state: p.state,
          instance_id: instance?.id ?? null,
          instance_status: instance?.status ?? null,
          file: attachment ? {
            file_id: attachment.file_id,
            original_name: attachment.file_record.original_name,
            attached_at: attachment.entry_ts,
            attached_by: attachment.attached_by,
            mime_type: attachment.file_record.file_version[0]?.mime_type ?? null,
            size_bytes: attachment.file_record.file_version[0]?.size_bytes?.toString() ?? null,
          } : null,
        }
      })

    return ok({ approvals })
  } catch (error: any) {
    console.error('GET /api/projects/[id]/form-xxii error:', error)
    return serverError('Failed to load Form-XXII approvals', error.message)
  }
}
