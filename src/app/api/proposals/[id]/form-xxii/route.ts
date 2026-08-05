import { NextResponse, NextRequest } from 'next/server'
import { authorizeApi } from '@/core/authorization/middleware/authorize'
import { ok, badRequest, notFound, serverError } from '@/app/api/_lib'
import { startDocumentWorkspaceUseCase } from '@/infrastructure/di/Container'
import { db } from '@/lib/db'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Ctx) {
  const auth = await authorizeApi('acquisition.view')
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: 403 })
  }

  const { id } = await params

  try {
    const result = await startDocumentWorkspaceUseCase.execute({
      templateCode: 'FORM_XXII',
      applicationId: id,
      userId: auth.user.id,
      extraData: {},
    })

    if (result.isFailure) {
        return serverError('Failed to generate Form-XXII', result.error as string)
    }

    return ok({ message: 'Form-XXII generation started', result: result.value })
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

    const proposal = await db.acq_proposal.findUnique({
      where: { proposal_id: id },
    })

    const project = proposal?.proj_cd ? await db.project.findUnique({
      where: { projCd: proposal.proj_cd },
      select: {
        projCd: true,
        projNm: true,
        totalApprovedArea: true,
        approved_tenancy_area: true,
        approved_govt_area: true,
        approved_forest_area: true,
        approved_excavation_area: true,
        approved_safety_zone_area: true,
        approved_ob_dump_area: true,
        approved_infra_area: true,
        approved_diversion_area: true,
        approved_rehab_area: true,
        landBudget: true,
        rrBudget: true,
        totalEmpSanctioned: true,
      }
    }) : null

    const fileInfo = attachment ? {
      file_id: attachment.file_id,
      original_name: attachment.file_record.original_name,
      attached_at: attachment.entry_ts,
      attached_by: attachment.attached_by,
      mime_type: attachment.file_record.file_version[0]?.mime_type ?? null,
      size_bytes: attachment.file_record.file_version[0]?.size_bytes?.toString() ?? null,
    } : null

    const projectLimits = project ? {
      project_id: project.projCd,
      project_name: project.projNm,
      total_land_limit_acres: project.totalApprovedArea?.toString(),
      approved_tenancy_area: project.approved_tenancy_area?.toString(),
      approved_govt_area: project.approved_govt_area?.toString(),
      approved_forest_area: project.approved_forest_area?.toString(),
      approved_excavation_area: project.approved_excavation_area?.toString(),
      approved_safety_zone_area: project.approved_safety_zone_area?.toString(),
      approved_ob_dump_area: project.approved_ob_dump_area?.toString(),
      approved_infra_area: project.approved_infra_area?.toString(),
      approved_diversion_area: project.approved_diversion_area?.toString(),
      approved_rehab_area: project.approved_rehab_area?.toString(),
      total_budget_ceiling: (Number(project.landBudget || 0) + Number(project.rrBudget || 0)).toString(),
      total_employment_quota: project.totalEmpSanctioned,
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
