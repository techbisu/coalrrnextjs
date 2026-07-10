import { ok, serverError } from '@/app/api/_lib'
import { authorizeApi } from '@/authorization/middleware/authorize'
import { db } from '@/lib/db'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApi('permission.manage')
  if (auth.error) {
    const authRole = await authorizeApi('role.manage')
    if (authRole.error) return authRole.error
  }

  try {
    const { id } = await params
    const userPermissions = await db.model_has_permission.findMany({
      where: { model_id: id, model_type: 'user' },
      include: { permission: true },
    })
    return ok(userPermissions.map((up) => up.permission))
  } catch (error: any) {
    return serverError(error.message)
  }
}
