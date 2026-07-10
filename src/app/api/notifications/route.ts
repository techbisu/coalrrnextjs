import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, serverError, badRequest } from '../_lib'

// In a real app, you would get the user ID from the session (e.g. NextAuth or JWT)
// For this MVP, we pass it via query param or assume a demo user.
export async function GET(req: NextRequest) {
  try {
    const user_id = req.nextUrl.searchParams.get('user_id')
    if (!user_id) return badRequest('user_id required')

    const notifications = await db.notification_log.findMany({
      where: { recipient_id: user_id, channel: 'IN_APP' },
      orderBy: { entry_ts: 'desc' },
      take: 50,
    })

    const unreadCount = notifications.filter(n => n.status !== 'READ').length

    const mapped = notifications.map(n => ({ ...n, entry_ts: n.entry_ts }))
    return ok({ notifications: mapped, unreadCount })
  } catch (e: any) {
    return serverError('Failed to fetch notifications', e.message)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, action } = await req.json()
    if (action === 'mark_read') {
      await db.notification_log.update({
        where: { id },
        data: { status: 'READ', read_at: new Date() }
      })
      return ok({ success: true })
    }
    
    if (action === 'mark_all_read') {
      const { user_id } = await req.json()
      await db.notification_log.updateMany({
        where: { recipient_id: user_id, channel: 'IN_APP', status: { not: 'READ' } },
        data: { status: 'READ', read_at: new Date() }
      })
      return ok({ success: true })
    }

    return badRequest('Invalid action')
  } catch (e: any) {
    return serverError('Failed to update notification', e.message)
  }
}
