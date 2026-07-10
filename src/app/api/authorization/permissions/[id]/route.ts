import { ok, badRequest, serverError, notFound, readJson } from '@/app/api/_lib'
import { authorizeApi } from '@/authorization/middleware/authorize'
import { permissionSchema } from '@/authorization/validators'
import { permissionService } from '@/infrastructure/di/Container'
import { db } from '@/lib/db'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApi('permission.manage')
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const permission = await db.permission.findUnique({
      where: { id },
    })
    if (!permission) return notFound('permission not found')
    return ok(permission)
  } catch (error: any) {
    return serverError(error.message)
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApi('permission.manage')
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const body = await readJson(req)
    const result = permissionSchema.partial().safeParse(body)
    if (!result.success) {
      return badRequest('Invalid payload', result.error.format())
    }

    const permission = await permissionService.update(id, result.data)
    return ok(permission)
  } catch (error: any) {
    return serverError(error.message)
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApi('permission.manage')
  if (auth.error) return auth.error

  try {
    const { id } = await params
    await permissionService.delete(id)
    return ok({ success: true })
  } catch (error: any) {
    return serverError(error.message)
  }
}
