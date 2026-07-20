import { getAdminUsersUseCase } from '@/infrastructure/di/Container'
import { UserManagementView } from './UserManagementView'
import { authorizeApi } from '@/core/authorization/middleware/authorize'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const auth = await authorizeApi('admin.users.view')
  if (auth.error) redirect('/')

  const result = await getAdminUsersUseCase.execute()
  if (!result.isSuccess) {
    return <div className="p-8 text-red-500">Failed to load users: {result.error}</div>
  }

  return <UserManagementView initialData={result.value!} />
}
