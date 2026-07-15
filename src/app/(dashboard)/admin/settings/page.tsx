import { getSystemConfigsUseCase } from '@/infrastructure/di/Container'
import { authorizeApi } from '@/core/authorization/middleware/authorize'
import { redirect } from 'next/navigation'
import { SettingsView } from './SettingsView'

export default async function SettingsPage() {
  // Only Super Administrators or those with specific config permissions
  const auth = await authorizeApi('project.view') // using project.view temporarily as a placeholder for admin access
  if (auth.error) redirect('/')

  const result = await getSystemConfigsUseCase.execute()
  if (!result.isSuccess) {
    return <div className="p-8 text-red-500">Failed to load settings: {result.error}</div>
  }

  return (
    <SettingsView initialConfigs={result.value} />
  )
}
