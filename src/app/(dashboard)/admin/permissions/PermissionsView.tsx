'use client'

import * as React from 'react'
import { SectionCard, DataTable, type Column } from '@/components/coalrr'
import { Lock, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { permission } from '@prisma/client'

export function PermissionsView({ initialPermissions }: { initialPermissions: permission[] }) {
  const columns: Column<permission>[] = [
    { key: 'name', header: 'Permission Key', sortable: true, render: (r) => <span className="font-mono text-sm font-semibold">{r.name}</span> },
    { key: 'display_name', header: 'Display Name', sortable: true },
    { key: 'module', header: 'Module', sortable: true, render: (r) => <Badge variant="outline">{r.module || 'System'}</Badge> },
    { key: 'group', header: 'Group', sortable: true },
    { key: 'description', header: 'Description' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Permission Matrix</h2>
          <p className="text-sm text-muted-foreground">Manage granular permissions across all modules.</p>
        </div>
        <Button className="bg-amber-600 hover:bg-amber-700 text-white">
          <Plus className="mr-2 h-4 w-4" /> Create Permission
        </Button>
      </div>

      <SectionCard title="Granular Permissions" icon={Lock} description="Direct capabilities required by specific actions">
        <DataTable
          columns={columns}
          data={initialPermissions}
          getRowId={(r) => r.id}
          pageSize={20}
        />
      </SectionCard>
    </div>
  )
}
