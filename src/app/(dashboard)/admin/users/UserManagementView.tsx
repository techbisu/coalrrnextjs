'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { SectionCard, DataTable, type Column } from '@/components/coalrr'
import { Users, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserFormDialog } from './UserFormDialog'
import { UserAccessDialog } from './UserAccessDialog'
import { UserScopeDialog } from './UserScopeDialog'
import { deleteUserAction, toggleUserStatusAction } from '@/modules/admin/users/presentation/actions'
import { toast } from 'sonner'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'

export function UserManagementView({ initialData }: { initialData: any[] }) {
  const router = useRouter()

  const handleMutationSuccess = () => {
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    try {
      const result = await deleteUserAction(id)
      if (result.error) throw new Error(result.error)
      toast.success('User deleted')
      handleMutationSuccess()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean, isVerified: boolean) => {
    try {
      // If not verified, the toggle implicitly approves them
      const result = await toggleUserStatusAction(id, { 
        is_active: !currentStatus, 
        approve: !isVerified ? true : undefined 
      })
      if (result.error) throw new Error(result.error)
      toast.success(currentStatus ? 'User disabled' : 'User activated')
      handleMutationSuccess()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const columns: Column<any>[] = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'email', header: 'Email', sortable: true },
    { key: 'mobile', header: 'Mobile', sortable: true },
    { key: 'role', header: 'Role', sortable: true },
    { key: 'designation', header: 'Designation', sortable: true },
    {
      key: 'portal',
      header: 'Portal',
      sortable: true,
      render: (r) => (
        <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-medium">
          {r.portal}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <div className="flex items-center gap-2">
          {!r.verified_at ? (
            <Badge variant="destructive" className="text-[10px]">Unverified</Badge>
          ) : (
            <Badge variant={r.is_active ? 'default' : 'secondary'} className="text-[10px]">
              {r.is_active ? 'Active' : 'Disabled'}
            </Badge>
          )}
          <Switch 
            checked={r.is_active && !!r.verified_at} 
            onCheckedChange={() => handleToggleStatus(r.id, r.is_active, !!r.verified_at)} 
            aria-label="Toggle active status"
          />
        </div>
      )
    },
    {
      key: '__actions' as any,
      header: 'Actions',
      render: (row: any) => (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" asChild>
            <Link href={`/admin/users/${row.id}`}>
              <Users className="h-3.5 w-3.5" />
              View
            </Link>
          </Button>
          <UserFormDialog
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
          <UserAccessDialog
            userId={row.id}
            userName={row.name}
            onSuccess={handleMutationSuccess}
          />
          <UserScopeDialog
            userId={row.id}
            userName={row.name}
            currentMineCd={row.mine_cd}
            onSuccess={handleMutationSuccess}
          />
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={() => handleDelete(row.id)}>
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">User Management</h2>
          <p className="text-sm text-muted-foreground">Manage system users, roles, and access.</p>
        </div>
        <UserFormDialog mode="create" onSuccess={handleMutationSuccess} />
      </div>

      <SectionCard title="System Users" icon={Users} description={`Total records: ${initialData.length}`}>
        <DataTable
          columns={columns}
          data={initialData}
          getRowId={(r) => r.id}
          pageSize={15}
        />
      </SectionCard>
    </div>
  )
}
