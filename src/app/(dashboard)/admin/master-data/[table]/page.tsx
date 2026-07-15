import { notFound } from 'next/navigation'
import { getMasterDataUseCase } from '@/infrastructure/di/Container'
import { MASTER_REGISTRY } from '@/modules/admin/master-data/config/MasterDataRegistry'
import { MasterDataView } from './MasterDataView'
import { authorizeApi } from '@/core/authorization/middleware/authorize'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function MasterDataPage({ params }: { params: Promise<{ table: string }> }) {
  const auth = await authorizeApi('project.view') // placeholder permission
  if (auth.error) redirect('/')

  const resolvedParams = await params
  const tableName = resolvedParams.table
  const config = MASTER_REGISTRY[tableName]
  console.log('DEBUG: tableName received:', tableName)
  console.log('DEBUG: config found:', !!config)

  if (!config) {
    throw new Error(`Table not found in registry. Requested: "${tableName}". Available keys: ${Object.keys(MASTER_REGISTRY).join(', ')}`)
  }

  const result = await getMasterDataUseCase.execute(config.modelName)
  if (!result.isSuccess) {
    return <div className="p-8 text-red-500">Failed to load {config.title}: {result.error}</div>
  }

  return <MasterDataView config={config} initialData={result.value!} />
}
