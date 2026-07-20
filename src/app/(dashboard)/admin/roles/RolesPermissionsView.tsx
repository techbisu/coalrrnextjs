'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { SectionCard, DataTable, type Column } from '@/components/coalrr'
import { ShieldCheck, Lock, Pencil, Trash2, Key } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { role, permission } from '@prisma/client'
import { RoleFormDialog } from './RoleFormDialog'
import { RolePermissionsDialog } from './RolePermissionsDialog'
import { PermissionFormDialog } from './PermissionFormDialog'
import { deleteRoleAction, deletePermissionAction } from '@/modules/admin/roles/presentation/actions'
import { toast } from 'sonner'

export function RolesPermissionsView({ 
  initialRoles, 
  initialPermissions 
}: { 
  initialRoles: role[]
  initialPermissions: permission[]
}) {
  const router = useRouter()
  const [activeTab, setActiveTab] = React.useState('roles')

  const handleMutationSuccess = () => {
    router.refresh()
  }

  const handleDeleteRole = async (id: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return
    try {
      const result = await deleteRoleAction(id)
      if (result.error) throw new Error(result.error)
      toast.success('Role deleted')
      handleMutationSuccess()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleDeletePermission = async (id: string) => {
    if (!confirm('Are you sure you want to delete this permission?')) return
    try {
      const result = await deletePermissionAction(id)
      if (result.error) throw new Error(result.error)
      toast.success('Permission deleted')
      handleMutationSuccess()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const roleColumns: Column<role>[] = [
    { key: 'name', header: 'Role Name', sortable: true, render: (r) => <span className="font-bold">{r.name}</span> },
    { key: 'display_name', header: 'Display Name', sortable: true },
    { key: 'guard_name', header: 'Guard', sortable: true, render: (r) => <span className="font-mono text-xs text-muted-foreground">{r.guard_name}</span> },
    { key: 'description', header: 'Description' },
    { key: 'is_system', header: 'System Role', render: (r) => <span className={r.is_system ? 'text-emerald-600 font-medium' : 'text-rose-500 font-medium'}>{r.is_system ? 'Yes' : 'No'}</span> },
    { key: 'entry_ts', header: 'Created', render: (r) => <span>{new Date(r.entry_ts).toLocaleDateString()}</span> },
    {
      key: '__actions' as any,
      header: 'Actions',
      render: (row: any) => (
        <div className="flex items-center gap-2">
          <RoleFormDialog
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
          <RolePermissionsDialog
            roleId={row.id}
            roleName={row.display_name || row.name}
            onSuccess={handleMutationSuccess}
          />
          {!row.is_system && (
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={() => handleDeleteRole(row.id)}>
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          )}
        </div>
      ),
    },
  ]

  const permissionColumns: Column<permission>[] = [
    { key: 'name', header: 'Permission Key', sortable: true, render: (r) => <span className="font-mono text-sm font-semibold">{r.name}</span> },
    { key: 'display_name', header: 'Display Name', sortable: true },
    { key: 'module', header: 'Module', sortable: true, render: (r) => <Badge variant="outline">{r.module || 'System'}</Badge> },
    { key: 'group', header: 'Group', sortable: true },
    { key: 'description', header: 'Description' },
    {
      key: '__actions' as any,
      header: 'Actions',
      render: (row: any) => (
        <div className="flex items-center gap-2">
          <PermissionFormDialog
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
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={() => handleDeletePermission(row.id)}>
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
          <h2 className="text-xl font-bold tracking-tight">Roles & Permissions</h2>
          <p className="text-sm text-muted-foreground">Manage system roles, granular permissions, and group assignments.</p>
        </div>
        <div>
          {activeTab === 'roles' ? (
            <RoleFormDialog mode="create" onSuccess={handleMutationSuccess} />
          ) : (
            <PermissionFormDialog mode="create" onSuccess={handleMutationSuccess} />
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-sm mb-4">
          <TabsTrigger value="roles" className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-2">
            <Key className="h-4 w-4" />
            Permissions
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="roles" className="mt-0 outline-hidden">
          <SectionCard title="System Roles" icon={ShieldCheck} description={`Total roles: ${initialRoles.length}`}>
            <DataTable
              columns={roleColumns}
              data={initialRoles}
              getRowId={(r) => r.id}
              pageSize={15}
            />
          </SectionCard>
        </TabsContent>
        
        <TabsContent value="permissions" className="mt-0 outline-hidden">
          <SectionCard title="Granular Permissions" icon={Lock} description={`Total permissions: ${initialPermissions.length}`}>
            <DataTable
              columns={permissionColumns}
              data={initialPermissions}
              getRowId={(r) => r.id}
              pageSize={20}
            />
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}
