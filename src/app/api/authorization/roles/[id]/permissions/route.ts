import { ok, badRequest, serverError, readJson } from '@/app/api/_lib'
import { authorizeApi } from '@/authorization/middleware/authorize'
import { syncPermissionsSchema } from '@/authorization/validators'
import { roleService } from '@/infrastructure/di/Container'
import { db } from '@/lib/db'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApi('role.manage')
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const permissions = await db.role_has_permission.findMany({
      where: { role_id: id },
      include: { permission: true },
    })
    return ok(permissions.map((rp) => rp.permission))
  } catch (error: any) {
    return serverError(error.message)
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApi('role.manage')
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const body = await readJson(req)
    const result = syncPermissionsSchema.safeParse(body)
    if (!result.success) {
      return badRequest('Invalid payload', result.error.format())
    }

    const { permissionIds } = result.data
    const perms = await db.permission.findMany({
      where: { id: { in: permissionIds } },
    })

    await roleService.syncPermissions(
      id,
      perms.map((p) => p.name)
    )

    return ok({ success: true })
  } catch (error: any) {
    return serverError(error.message)
  }
}
