import { getCurrentUser, ROLE_LABELS } from '@/lib/auth'
import { ok } from '../../_lib'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return ok({ user: null })
  return ok({ user: { ...user, roleLabel: ROLE_LABELS[user.role] ?? user.role } })
}
