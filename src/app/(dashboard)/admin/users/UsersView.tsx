'use client'

import * as React from 'react'
import { SectionCard, DataTable, type Column, StateBadge } from '@/components/coalrr'
import { Users, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { user } from '@prisma/client'

export function UsersView({ initialUsers }: { initialUsers: user[] }) {
  const columns: Column<user>[] = [
    { key: 'name', header: 'Name', sortable: true, render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'email', header: 'Email', sortable: true },
    { key: 'role', header: 'Role', sortable: true, render: (r) => <span className="font-mono text-xs">{r.role}</span> },
    { key: 'portal', header: 'Portal', sortable: true, render: (r) => <StateBadge state={r.portal} /> },
    { key: 'designation', header: 'Designation' },
    { key: 'entry_ts', header: 'Joined', render: (r) => <span>{new Date(r.entry_ts).toLocaleDateString()}</span> },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">User Administration</h2>
          <p className="text-sm text-muted-foreground">Manage all system users, their basic roles, and portal access.</p>
        </div>
        <Button className="bg-amber-600 hover:bg-amber-700 text-white">
          <Plus className="mr-2 h-4 w-4" /> Add User
        </Button>
      </div>

      <SectionCard title="System Users" icon={Users} description="Complete directory of ECL and Public portal users">
        <DataTable
          columns={columns}
          data={initialUsers}
          getRowId={(r) => r.id.toString()}
          pageSize={15}
        />
      </SectionCard>
    </div>
  )
}
