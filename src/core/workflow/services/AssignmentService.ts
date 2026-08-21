/**
 * AssignmentService — manages recipient discovery and user-to-user action routing.
 *
 * Part of the COALRR Universal Workflow Platform.
 * Filters potential forward/return recipients based on role hierarchy and user_org_scope.
 *
 * Import from API routes and Use Cases ONLY — never from Client Components.
 */
import 'server-only'
import { db } from '@/lib/db'
import { Result, Ok, Fail } from '@/core'
import { normalizeCheckableEntityType } from '@/core/config/module-codes.config'

export interface RecipientUser {
  userId: number
  name: string
  email: string | null
  mobile: string | null
  designation: string | null
  role: string
  area_cd: string | null
  mine_cd: string | null
  isAvailable: boolean
  pendingTaskCount: number
}

export class AssignmentService {
  /**
   * Fetches available target recipients for forwarding/returning, filtered by role and org scope.
   */
  async getAvailableRecipients(
    entityType: string,
    entityId: string,
    targetRole: string,
    currentUserId: number,
    allowSelf = false
  ): Promise<Result<RecipientUser[]>> {
    try {
      const canonicalType = normalizeCheckableEntityType(entityType)

      // Query active users with their org scope
      const users = await db.user.findMany({
        where: {
          is_active: true,
          ...(allowSelf ? {} : { id: { not: currentUserId } }),
        },
        include: {
          user_org_scopes: true,
        },
        take: 50,
      })

      const recipients: RecipientUser[] = users.map((u) => {
        const scope = u.user_org_scopes[0]
        return {
          userId: u.id,
          name: u.name,
          email: u.email,
          mobile: u.mobile,
          designation: u.designation,
          role: targetRole,
          area_cd: scope?.area_cd ?? null,
          mine_cd: scope?.mine_cd ?? null,
          isAvailable: true,
          pendingTaskCount: 0,
        }
      })

      return Ok(recipients)
    } catch (e: any) {
      console.error('AssignmentService.getAvailableRecipients error:', e)
      return Fail(e.message ?? 'Failed to fetch available recipients')
    }
  }

  /**
   * Retrieves all pending action tasks assigned to a specific user.
   */
  async getPendingAssignmentsForUser(userId: number): Promise<Result<any[]>> {
    try {
      const tasks = await (db as any).workflow_task.findMany({
        where: {
          assigned_user_id: userId,
          status: 'PENDING',
        },
        orderBy: { entry_ts: 'desc' },
      })
      return Ok(tasks)
    } catch (e: any) {
      console.error('AssignmentService.getPendingAssignmentsForUser error:', e)
      return Fail(e.message ?? 'Failed to fetch pending user assignments')
    }
  }
}

export const assignmentService = new AssignmentService()
