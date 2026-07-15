import { MASTER_REGISTRY } from '@/modules/admin/master-data/config/MasterDataRegistry'
import { SectionCard } from '@/components/coalrr'
import { Database } from 'lucide-react'
import Link from 'next/link'
import { authorizeApi } from '@/core/authorization/middleware/authorize'
import { redirect } from 'next/navigation'

export default async function MasterDataLandingPage() {
  const auth = await authorizeApi('project.view')
  if (auth.error) redirect('/')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Master Data Management</h2>
          <p className="text-sm text-muted-foreground">Manage global dropdowns, lists, and reference tables.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Object.entries(MASTER_REGISTRY).map(([key, config]) => (
          <Link href={`/admin/master-data/${key}`} key={key}>
            <div className="group rounded-xl border bg-card hover:border-amber-500/50 hover:bg-amber-50/50 transition-all cursor-pointer h-full">
              <div className="p-5 flex flex-col space-y-1.5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg text-amber-700 group-hover:scale-110 transition-transform">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold leading-none tracking-tight">{config.title}</h3>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{config.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
