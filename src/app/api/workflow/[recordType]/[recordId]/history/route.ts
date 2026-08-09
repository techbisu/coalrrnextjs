import { NextRequest } from 'next/server'
import { authorizeApi } from '@/core/authorization/middleware/authorize'
import { ok, serverError } from '@/app/api/_lib'
import { workflowActionHistoryService } from '@/core/workflow/services/WorkflowActionHistoryService'
import { db } from '@/lib/db'

type Ctx = { params: Promise<{ recordType: string; recordId: string }> }

export async function GET(req: NextRequest, ctx: Ctx) {
  const auth = await authorizeApi('proposal.view')
  if (auth.error) return auth.error

  const { recordType, recordId } = await ctx.params

  try {
    const history = await workflowActionHistoryService.getHistoryForEntity(recordType, recordId)

    // Fetch polymorphic parallel review tasks if any exist for this record
    const parallelTasks = await (db as any).workflow_review_task.findMany({
      where: {
        entity_type: recordType,
        entity_id: recordId,
      },
      orderBy: { entry_ts: 'asc' },
    })

    return ok({
      entityType: recordType,
      entityId: recordId,
      history,
      parallelTasks,
    })
  } catch (e: any) {
    console.error('GET /api/workflow/[recordType]/[recordId]/history error:', e)
    return serverError('Failed to fetch workflow history', e.message)
  }
}
