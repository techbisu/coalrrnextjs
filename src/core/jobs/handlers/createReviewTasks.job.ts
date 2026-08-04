import { db } from '@/lib/db'

export interface CreateReviewTasksPayload {
  reviewableType: string
  reviewableId: string
  roles: string[]
}

export const createReviewTasksHandler = async (payload: CreateReviewTasksPayload): Promise<void> => {
  const { reviewableType, reviewableId, roles } = payload

  if (!roles || roles.length === 0) {
    return
  }

  const { randomUUID } = await import('crypto')

  try {
    const data = roles.map(role => ({
      review_task_id: randomUUID(),
      entity_type: reviewableType,
      entity_id: reviewableId,
      role: role,
      status: 'pending',
      entry_ts: new Date(),
      updt_ts: new Date(),
      entry_by: 'system',
      updt_by: 'system'
    }))

    await (db as any).workflow_review_task.createMany({
      data,
      skipDuplicates: true
    })
    
    console.log(`[Job] createReviewTasks: Created ${data.length} tasks for ${reviewableType} ${reviewableId}`)
  } catch (error) {
    console.error(`[Job] createReviewTasks: Failed to create review tasks`, error)
    throw error
  }
}
