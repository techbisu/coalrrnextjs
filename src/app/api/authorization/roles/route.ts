import { ok, badRequest, serverError, readJson } from '@/app/api/_lib'
import { authorizeApi } from '@/authorization/middleware/authorize'
import { roleSchema } from '@/authorization/validators'
import { roleService } from '@/infrastructure/di/Container'
import { db } from '@/lib/db'

export async function GET() {
  const auth = await authorizeApi('role.manage')
  if (auth.error) return auth.error

  try {
    const roles = await db.role.findMany({
      orderBy: [{ is_system: 'desc' }, { name: 'asc' }],
      include: {
        _count: {
          select: { model_has_role: true, role_has_permission: true },
        },
      },
    })
    return ok(roles)
  } catch (error: any) {
    return serverError(error.message)
  }
}

export async function POST(req: Request) {
  const auth = await authorizeApi('role.manage')
  if (auth.error) return auth.error

  try {
    const body = await readJson(req)
    const result = roleSchema.safeParse(body)
    if (!result.success) {
      return badRequest('Invalid payload', result.error.format())
    }

    const role = await roleService.create(result.data)
    return ok(role)
  } catch (error: any) {
    return serverError(error.message)
  }
}
