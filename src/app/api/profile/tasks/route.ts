import { ok, serverError, unauthorized } from '@/app/api/_lib'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return unauthorized('Unauthorized')

  try {
    // Determine the user's active roles
    const activeRoles = user.roles || []

    const tasks = await db.workflow_review_task.findMany({
      where: {
        role: { in: activeRoles },
        status: 'pending',
      },
      orderBy: {
        entry_ts: 'desc'
      }
    })

    return ok(tasks)
  } catch (error) {
    console.error('Failed to fetch tasks:', error)
    return serverError('Failed to fetch tasks')
  }
}
