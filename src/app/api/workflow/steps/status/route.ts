import 'server-only'
import { NextResponse } from 'next/server'
import { stepTrackingService } from '@/core/workflow/services/StepTrackingService'
import { StepStatusQuerySchema } from '@/shared/schemas/step-tracking.schema'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const rawQuery = {
      entityType: searchParams.get('entityType'),
      entityId: searchParams.get('entityId'),
      stepGroup: searchParams.get('stepGroup') ?? undefined,
    }

    const parsed = StepStatusQuerySchema.safeParse(rawQuery)
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Invalid query parameters', details: parsed.error.format() },
        { status: 400 }
      )
    }

    const result = await stepTrackingService.getStepStatus(
      parsed.data.entityType,
      parsed.data.entityId,
      parsed.data.stepGroup
    )

    if (result.isFailure) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      data: result.value,
    })
  } catch (error: any) {
    console.error('GET /api/workflow/steps/status error:', error)
    return NextResponse.json(
      { ok: false, error: error.message ?? 'Internal Server Error' },
      { status: 500 }
    )
  }
}
