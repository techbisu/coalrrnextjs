import { ok, badRequest, serverError, readJson } from '@/app/api/_lib'
import { authorizeApi } from '@/authorization/middleware/authorize'
import { permissionSchema } from '@/authorization/validators'
import { PermissionService } from '@/authorization/services/PermissionService'
import { db } from '@/lib/db'

export async function GET() {
  const auth = await authorizeApi('permission.manage')
  if (auth.error) return auth.error

  try {
    const permissions = await db.permission.findMany({
      orderBy: [{ module: 'asc' }, { name: 'asc' }],
    })
    return ok(permissions)
  } catch (error: any) {
    return serverError(error.message)
  }
}

export async function POST(req: Request) {
  const auth = await authorizeApi('permission.manage')
  if (auth.error) return auth.error

  try {
    const body = await readJson(req)
    const result = permissionSchema.safeParse(body)
    if (!result.success) {
      return badRequest('Invalid payload', result.error.format())
    }

    const permission = await PermissionService.create(result.data)
    return ok(permission)
  } catch (error: any) {
    return serverError(error.message)
  }
}
