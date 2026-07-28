import { getAdminUsersUseCase } from '@/infrastructure/di/Container'
import { UserManagementView } from './UserManagementView'
import { authorizeApi } from '@/core/authorization/middleware/authorize'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ page?: string, q?: string, tab?: 'verified' | 'unverified' }> }) {
  const auth = await authorizeApi('admin.users.view')
  if (auth.error) redirect('/')

  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const search = params.q || '';
  const status = params.tab || 'verified';
  const limit = 15;

  const result = await getAdminUsersUseCase.execute({ page, limit, search, status })
  if (!result.isSuccess) {
    return <div className="p-8 text-red-500">Failed to load users: {result.error}</div>
  }

  return (
    <UserManagementView 
      initialData={result.value!.data} 
      totalRecords={result.value!.total}
      unverifiedCount={result.value!.unverifiedCount}
      currentPage={page}
      searchQuery={search}
      activeTab={status}
      pageSize={limit}
    />
  )
}
