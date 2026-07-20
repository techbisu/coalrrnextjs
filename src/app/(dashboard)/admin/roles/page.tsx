import { getAdminRolesUseCase, getAdminPermissionsUseCase } from '@/infrastructure/di/Container'
import { RolesPermissionsView } from './RolesPermissionsView'
import { authorizeApi } from '@/core/authorization/middleware/authorize'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AdminRolesPermissionsPage() {
  const auth = await authorizeApi('admin.roles.view')
  if (auth.error) redirect('/')

  const [rolesResult, permissionsResult] = await Promise.all([
    getAdminRolesUseCase.execute(),
    getAdminPermissionsUseCase.execute(),
  ])

  if (!rolesResult.isSuccess || !permissionsResult.isSuccess) {
    return <div className="p-8 text-red-500">Failed to load roles or permissions.</div>
  }

  return (
    <RolesPermissionsView 
      initialRoles={rolesResult.value!} 
      initialPermissions={permissionsResult.value!} 
    />
  )
}
