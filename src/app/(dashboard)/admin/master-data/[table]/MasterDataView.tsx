'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { SectionCard, DataTable, type Column } from '@/shared/components/coalrr'
import { ArrowLeft, Database, Pencil } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { BackButton } from '@/shared/components/ui/back-button'
import { MasterDataClientConfig } from '@/core/config/master.config'
import { MasterFormDialog } from './MasterFormDialog'

export function MasterDataView({ config, initialData }: { config: MasterDataClientConfig, initialData: any[] }) {
  const router = useRouter()

  // Re-run the server component to fetch fresh data after any mutation
  const handleMutationSuccess = () => {
    router.refresh()
  }

  // Dynamically build columns based on config
  const columns: Column<any>[] = [
    ...config.columns.map(col => ({
      key: col.key as any,
      header: col.label,
      sortable: true,
      render: (r: any) => {
        const val = r[col.key]
        if (col.type === 'boolean') {
          return (
            <span className={val ? 'text-emerald-600 font-medium' : 'text-rose-500 font-medium'}>
              {val ? 'Yes' : 'No'}
            </span>
          )
        }
        return <span>{val?.toString() || '-'}</span>
      },
    })),
    // Action column
    {
      key: '__actions' as any,
      header: 'Actions',
      render: (row: any) => (
        <MasterFormDialog
          config={config}
          mode="edit"
          initialData={row}
          onSuccess={handleMutationSuccess}
          trigger={
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          }
        />
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-2">
          <BackButton iconOnly />
          <div>
            <h2 className="text-xl font-bold tracking-tight">{config.title}</h2>
            <p className="text-sm text-muted-foreground">{config.description}</p>
          </div>
        </div>
        <MasterFormDialog
          config={config}
          mode="create"
          onSuccess={handleMutationSuccess}
        />
      </div>

      <SectionCard title={config.title} icon={Database} description={`Total records: ${initialData.length}`}>
        <DataTable
          columns={columns}
          data={initialData}
          getRowId={(r) => r[config.primaryKey]}
          pageSize={15}
        />
      </SectionCard>
    </div>
  )
}
