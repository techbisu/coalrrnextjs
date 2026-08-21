import 'server-only'
import { NextResponse } from 'next/server'
import { assignmentService } from '@/core/workflow/services/AssignmentService'
import { WorkflowRecipientsQuerySchema } from '@/shared/schemas/step-tracking.schema'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const rawQuery = {
      entityType: searchParams.get('entityType'),
      entityId: searchParams.get('entityId'),
      targetRole: searchParams.get('targetRole'),
      allowSelf: searchParams.get('allowSelf') ?? 'false',
    }

    const parsed = WorkflowRecipientsQuerySchema.safeParse(rawQuery)
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Invalid query parameters', details: parsed.error.format() },
        { status: 400 }
      )
    }

    // Default mock/fallback session user id if auth middleware missing
    const currentUserId = 1

    const result = await assignmentService.getAvailableRecipients(
      parsed.data.entityType,
      parsed.data.entityId,
      parsed.data.targetRole,
      currentUserId,
      parsed.data.allowSelf
    )

    if (result.isFailure) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      recipients: result.value,
    })
  } catch (error: any) {
    console.error('GET /api/workflow/recipients error:', error)
    return NextResponse.json(
      { ok: false, error: error.message ?? 'Internal Server Error' },
      { status: 500 }
    )
  }
}
