import { ok, badRequest, serverError, readJson } from '@/app/api/_lib'
import { authorizeApi } from '@/authorization/middleware/authorize'
import { syncRolesSchema } from '@/authorization/validators'
import { RoleService } from '@/authorization/services/RoleService'
import { db } from '@/lib/db'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApi('role.manage')
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const userRoles = await db.modelHasRole.findMany({
      where: { modelId: id, modelType: 'User' },
      include: { role: true },
    })
    return ok(userRoles.map((ur) => ur.role))
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
    const result = syncRolesSchema.safeParse(body)
    if (!result.success) {
      return badRequest('Invalid payload', result.error.format())
    }

    const { roleIds } = result.data
    const roles = await db.role.findMany({
      where: { id: { in: roleIds } },
    })

    await RoleService.syncUserRoles(
      id,
      roles.map((r) => r.name)
    )

    return ok({ success: true })
  } catch (error: any) {
    return serverError(error.message)
  }
}
