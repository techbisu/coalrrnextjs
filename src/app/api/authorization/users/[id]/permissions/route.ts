import { ok, badRequest, serverError, readJson } from '@/app/api/_lib'
import { authorizeApi } from '@/authorization/middleware/authorize'
import { syncPermissionsSchema } from '@/authorization/validators'
import { PermissionCache } from '@/core/authorization/cache/PermissionCache'
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

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApi('permission.manage')
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const body = await readJson(req)
    const result = syncPermissionsSchema.safeParse(body)
    if (!result.success) {
      return badRequest('Invalid payload', result.error.format())
    }

    const { permissionIds } = result.data

    // Replace all direct permissions for this user
    await db.model_has_permission.deleteMany({
      where: { model_id: id, model_type: 'user' },
    })
    if (permissionIds.length > 0) {
      await db.model_has_permission.createMany({
        data: permissionIds.map(permission_id => ({
          permission_id,
          model_type: 'user',
          model_id: id,
        })),
      })
    }
    await PermissionCache.invalidate(id)

    return ok({ success: true })
  } catch (error: any) {
    return serverError(error.message)
  }
}
