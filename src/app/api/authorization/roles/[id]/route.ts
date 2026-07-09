import { ok, badRequest, serverError, notFound, readJson } from '@/app/api/_lib'
import { authorizeApi } from '@/authorization/middleware/authorize'
import { roleSchema } from '@/authorization/validators'
import { RoleService } from '@/authorization/services/RoleService'
import { db } from '@/lib/db'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApi('role.manage')
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const role = await db.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    })
    if (!role) return notFound('Role not found')
    return ok(role)
  } catch (error: any) {
    return serverError(error.message)
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApi('role.manage')
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const body = await readJson(req)
    const result = roleSchema.partial().safeParse(body)
    if (!result.success) {
      return badRequest('Invalid payload', result.error.format())
    }

    const role = await RoleService.update(id, result.data)
    return ok(role)
  } catch (error: any) {
    return serverError(error.message)
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApi('role.manage')
  if (auth.error) return auth.error

  try {
    const { id } = await params
    await RoleService.delete(id)
    return ok({ success: true })
  } catch (error: any) {
    return serverError(error.message)
  }
}
