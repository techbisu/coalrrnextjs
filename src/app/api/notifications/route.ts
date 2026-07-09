import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, serverError, badRequest } from '../_lib'

// In a real app, you would get the user ID from the session (e.g. NextAuth or JWT)
// For this MVP, we pass it via query param or assume a demo user.
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return badRequest('userId required')

    const notifications = await db.notificationLog.findMany({
      where: { recipientId: userId, channel: 'IN_APP' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const unreadCount = notifications.filter(n => n.status !== 'READ').length

    return ok({ notifications, unreadCount })
  } catch (e: any) {
    return serverError('Failed to fetch notifications', e.message)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, action } = await req.json()
    if (action === 'mark_read') {
      await db.notificationLog.update({
        where: { id },
        data: { status: 'READ', readAt: new Date() }
      })
      return ok({ success: true })
    }
    
    if (action === 'mark_all_read') {
      const { userId } = await req.json()
      await db.notificationLog.updateMany({
        where: { recipientId: userId, channel: 'IN_APP', status: { not: 'READ' } },
        data: { status: 'READ', readAt: new Date() }
      })
      return ok({ success: true })
    }

    return badRequest('Invalid action')
  } catch (e: any) {
    return serverError('Failed to update notification', e.message)
  }
}
