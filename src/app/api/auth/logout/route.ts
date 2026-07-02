import { destroySession } from '@/lib/auth'
import { ok } from '../../_lib'

export async function POST() {
  await destroySession()
  return ok({ message: 'Logged out' })
}
