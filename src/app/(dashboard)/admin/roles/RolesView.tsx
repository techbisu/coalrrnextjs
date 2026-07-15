'use client'

import * as React from 'react'
import { SectionCard, DataTable, type Column } from '@/components/coalrr'
import { ShieldCheck, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { role } from '@prisma/client'

export function RolesView({ initialRoles }: { initialRoles: role[] }) {
  const columns: Column<role>[] = [
    { key: 'name', header: 'Role Name', sortable: true, render: (r) => <span className="font-bold">{r.name}</span> },
    { key: 'display_name', header: 'Display Name', sortable: true },
    { key: 'guard_name', header: 'Guard', sortable: true, render: (r) => <span className="font-mono text-xs text-muted-foreground">{r.guard_name}</span> },
    { key: 'description', header: 'Description' },
    { key: 'is_system', header: 'System Role', render: (r) => <span>{r.is_system ? 'Yes' : 'No'}</span> },
    { key: 'entry_ts', header: 'Created', render: (r) => <span>{new Date(r.entry_ts).toLocaleDateString()}</span> },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Role Management</h2>
          <p className="text-sm text-muted-foreground">Manage system roles and group assignments.</p>
        </div>
        <Button className="bg-amber-600 hover:bg-amber-700 text-white">
          <Plus className="mr-2 h-4 w-4" /> Create Role
        </Button>
      </div>

      <SectionCard title="System Roles" icon={ShieldCheck} description="RBAC roles used for access control">
        <DataTable
          columns={columns}
          data={initialRoles}
          getRowId={(r) => r.id}
          pageSize={15}
        />
      </SectionCard>
    </div>
  )
}
