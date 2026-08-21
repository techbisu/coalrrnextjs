import 'server-only'
import { NextResponse } from 'next/server'
import { stepTrackingService } from '@/core/workflow/services/StepTrackingService'
import { CompleteStepSchema } from '@/shared/schemas/step-tracking.schema'
import { authorizeModuleApi } from '@/core/authorization/middleware/authorize'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const parsed = CompleteStepSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Invalid step completion payload', details: parsed.error.format() },
        { status: 400 }
      )
    }

    const auth = await authorizeModuleApi(parsed.data.entityType, 'edit')
    if ('error' in auth) {
      return auth.error
    }

    const currentUserId = Number(auth.user.id)

    const result = await stepTrackingService.completeStep({
      entityType: parsed.data.entityType,
      entityId: parsed.data.entityId,
      stepGroup: parsed.data.stepGroup,
      stepKey: parsed.data.stepKey,
      userId: currentUserId,
      remarks: parsed.data.remarks,
    })

    if (result.isFailure) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      ok: true,
      data: result.value,
    })
  } catch (error: any) {
    console.error('POST /api/workflow/steps/complete error:', error)
    return NextResponse.json(
      { ok: false, error: error.message ?? 'Internal Server Error' },
      { status: 500 }
    )
  }
}
