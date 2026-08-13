/**
 * GET /api/workflow/states?workflowCode=LAND_SCHEDULE
 *
 * Returns DB-driven state metadata for a workflow module.
 * Client Components use this to render the stepper, badges, and Action Center
 * without importing any hardcoded TS state maps.
 *
 * Response shape:
 * {
 *   states: Array<{
 *     state_code: string
 *     label: string
 *     description: string | null
 *     color: string | null
 *     icon: string | null
 *     step_order: number
 *     is_terminal: boolean
 *   }>
 * }
 */
import { NextRequest, NextResponse } from 'next/server'
import { ConfigCacheService } from '@/core/config/cache/ConfigCacheService'
import { resolveWorkflowCode, normalizeModuleCode } from '@/core/config/module-codes.config'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const rawCode = searchParams.get('workflowCode') || searchParams.get('moduleCode')
    if (!rawCode) {
      return NextResponse.json({ error: 'workflowCode query param is required' }, { status: 400 })
    }

    const workflowCode = resolveWorkflowCode(normalizeModuleCode(rawCode))
    const rows = await ConfigCacheService.getWorkflowStates(workflowCode)

    const states = rows.map((row: any) => ({
      state_code: row.state_code,
      label: row.label,
      description: row.description ?? null,
      color: row.color ?? null,
      icon: row.icon ?? null,
      step_order: Number(row.step_order),
      is_terminal: Boolean(row.is_terminal),
    }))

    return NextResponse.json({ workflowCode, states })
  } catch (e: any) {
    console.error('[GET /api/workflow/states] error:', e)
    return NextResponse.json({ error: 'Failed to load workflow states', message: e.message }, { status: 500 })
  }
}
