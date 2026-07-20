import { getCurrentUser, ROLE_LABELS } from '@/lib/auth'
import { ok } from '../../_lib'
import { NextResponse } from 'next/server'
// Force Turbopack reload to clear memory cache

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return ok({ user: null })
    return ok({ user: { ...user, roleLabel: ROLE_LABELS[user.role] ?? user.role } })
  } catch (e: any) {
    return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 })
  }
}
