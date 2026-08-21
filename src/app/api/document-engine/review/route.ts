import { NextResponse, NextRequest } from 'next/server'
import { authorizeApi } from '@/core/authorization/middleware/authorize'
import { ok, serverError, badRequest } from '@/app/api/_lib'
import { db } from '@/lib/db'
import { Container } from '@/infrastructure/di/Container'
import { Audit } from '@/core/audit/services/AuditService'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { instanceId, decision, comment } = body

    if (!instanceId || !decision) {
      return badRequest('instanceId and decision are required')
    }

    if (!['APPROVED', 'REVISION_REQUESTED'].includes(decision)) {
      return badRequest('decision must be APPROVED or REVISION_REQUESTED')
    }

    // 1. Fetch document instance using Container
    const instance = await Container.documentInstanceRepository.findById(instanceId)
    if (!instance) {
      return badRequest('Document instance not found')
    }

    // 2. Server-side Auth and Permission Check
    const reqPerm = `${instance.template_code.toLowerCase()}.review`
    const auth = await authorizeApi([reqPerm, 'document.review', 'workflow.approve', 'proposal.approve', 'acquisition.approve', 'project.view'])
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: 403 })
    }

    const userPerms = auth.user.permissions || []
    const hasPermission =
      userPerms.includes(reqPerm) ||
      userPerms.includes('document.review') ||
      userPerms.includes('workflow.approve') ||
      userPerms.includes('*') ||
      (auth.user.roles || []).some(r => {
        const rl = r.toLowerCase().replace(/[^a-z0-9]/g, '')
        return rl.includes('admin') || rl.includes('super') || rl.includes('officer') || rl.includes('cell') || rl.includes('manager') || rl.includes('gm')
      })

    if (!hasPermission) {
      return NextResponse.json({ error: `Forbidden: Requires permission ${reqPerm}` }, { status: 403 })
    }

    // 4. Record review decision in review_data_json (with fallback for un-restarted Prisma client)
    let existingReviews = Array.isArray((instance as any).review_data_json)
      ? ((instance as any).review_data_json as any[])
      : []

    if ((instance as any).review_data_json === undefined) {
      try {
        const rawRows: any[] = await db.$queryRawUnsafe(
          `SELECT review_data_json FROM public.document_instance WHERE id = $1`,
          instanceId
        )
        if (rawRows.length > 0 && rawRows[0].review_data_json) {
          existingReviews = Array.isArray(rawRows[0].review_data_json) ? rawRows[0].review_data_json : []
        }
      } catch (rawErr) {
        console.warn('Raw query for review_data_json failed:', rawErr)
      }
    }

    const reviewEntry = {
      decision,
      comment: comment || '',
      reviewerId: auth.user.id,
      reviewerName: auth.user.name || auth.user.email,
      permission: reqPerm,
      timestamp: new Date().toISOString()
    }

    const updatedReviews = [...existingReviews, reviewEntry]

    await db.$transaction(async (tx) => {
      try {
        await tx.document_instance.update({
          where: { id: instanceId },
          data: {
            review_data_json: updatedReviews
          } as any
        })
      } catch (updateErr: any) {
        if (updateErr.message?.includes('Unknown argument') || updateErr.message?.includes('review_data_json')) {
          await tx.$executeRawUnsafe(
            `UPDATE public.document_instance SET review_data_json = $1::jsonb WHERE id = $2`,
            JSON.stringify(updatedReviews),
            instanceId
          )
        } else {
          throw updateErr
        }
      }

      // Emit outbox event
      await tx.outbox_events.create({
        data: {
          event_name: decision === 'APPROVED' ? 'DOCUMENT_REVIEWED' : 'DOCUMENT_REVISION_REQUESTED',
          module: 'DOCUMENT_ENGINE',
          payload: {
            instanceId,
            templateCode: instance.template_code,
            applicationId: instance.application_id,
            decision,
            reviewerId: auth.user.id
          }
        }
      })
    })

    // 5. Audit Log
    await Audit.logCustomAction({
      activity: `Document ${instance.template_code} review decision: ${decision}`,
      userId: auth.user.id,
      ipAddress: undefined,
      userAgent: undefined
    })

    return ok({
      success: true,
      decision,
      reviews: updatedReviews
    })
  } catch (error: any) {
    console.error('Error in POST /api/document-engine/review:', error)
    return serverError('Failed to record document review', error.message)
  }
}
