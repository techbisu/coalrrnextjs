import { ok, serverError } from '@/app/api/_lib'
import { authorizeApi } from '@/authorization/middleware/authorize'
import { permissionService } from '@/infrastructure/di/Container'

export async function GET() {
  const authRole = await authorizeApi('role.manage')
  const authPerm = await authorizeApi('permission.manage')

  if (authRole.error && authPerm.error) {
    return authRole.error
  }

  try {
    const matrix = await permissionService.getMatrix()
    return ok(matrix)
  } catch (error: any) {
    return serverError(error.message)
  }
}
