/**
 * GET /api/milestones/definitions?moduleCode=LAND_SCHEDULE&entityType=acq_land_schedule
 *
 * Returns DB-driven milestone definitions for a module.
 * Replaces the hardcoded milestoneConfig import in ManualMilestonePanel and
 * milestone API routes — any new module just needs rows in milestone_definition.
 */
import { NextRequest, NextResponse } from 'next/server'
import { manualMilestoneService } from '@/core/workflow/services/ManualMilestoneService'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const moduleCode = searchParams.get('moduleCode')
    const entityType = searchParams.get('entityType') || undefined

    if (!moduleCode) {
      return NextResponse.json({ error: 'moduleCode query param is required' }, { status: 400 })
    }

    const result = await manualMilestoneService.getDefinitionsForModule(moduleCode, entityType)
    if (!result.isSuccess) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ definitions: result.value })
  } catch (e: any) {
    console.error('[GET /api/milestones/definitions] error:', e)
    return NextResponse.json({ error: 'Failed to load milestone definitions', message: e.message }, { status: 500 })
  }
}
