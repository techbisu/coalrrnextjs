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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { usePathname, useSearchParams } from 'next/navigation'

export function UserManagementView({ 
  initialData,
  totalRecords = 0,
  unverifiedCount = 0,
  currentPage = 1,
  searchQuery = '',
  activeTab = 'verified',
  pageSize = 15
}: { 
  initialData: any[]
  totalRecords?: number
  unverifiedCount?: number
  currentPage?: number
  searchQuery?: string
  activeTab?: string
  pageSize?: number
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleSearchChange = (query: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', '1') // reset page on search
    if (query) {
      params.set('q', query)
    } else {
      params.delete('q')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', '1')
    params.set('tab', tab)
    router.push(`${pathname}?${params.toString()}`)
  }

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
    { 
      key: 'name', 
      header: 'Name', 
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <span className="font-medium text-slate-900">{r.name}</span>
            {r.is_online && (
              <span className="flex items-center text-[10px] text-green-600 font-medium mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
                Online
              </span>
            )}
          </div>
        </div>
      )
    },
    { key: 'email', header: 'Email', sortable: true },
    { key: 'mobile', header: 'Mobile', sortable: true },
    { key: 'role', header: 'Role', sortable: true },
    { key: 'designation', header: 'Designation', sortable: true },
    {
      key: 'tenant_name',
      header: 'Tenant / Organization',
      render: (r: any) => (
        <span className="font-medium text-xs bg-slate-100 px-2 py-0.5 rounded-full border">
          {r.tenant_name || 'N/A'}
        </span>
      ),
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
            currentScope={row.scope}
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

  const verifiedUsers = activeTab === 'verified' ? initialData : []
  const unverifiedUsers = activeTab === 'unverified' ? initialData : []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">User Management</h2>
          <p className="text-sm text-muted-foreground">Manage system users, roles, and access.</p>
        </div>
        <UserFormDialog mode="create" onSuccess={handleMutationSuccess} />
      </div>

      <div className="bg-card border rounded-lg shadow-sm">
        <div className="p-6 pb-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full sm:w-auto">
              <TabsList>
                <TabsTrigger value="verified">Verified Users</TabsTrigger>
                <TabsTrigger value="unverified" className="flex items-center gap-2">
                  Unverified Users
                  {unverifiedCount > 0 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-amber-100 text-amber-700 hover:bg-amber-100">
                      {unverifiedCount}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                defaultValue={searchQuery}
                onChange={(e) => {
                  const timer = setTimeout(() => {
                    handleSearchChange(e.target.value)
                  }, 500)
                  return () => clearTimeout(timer)
                }}
                placeholder="Search users..."
                className="pl-9 bg-background"
              />
            </div>
          </div>
          
          <DataTable
            columns={columns}
            data={initialData}
            getRowId={(r) => r.id}
            pageSize={pageSize}
            serverSide={true}
            totalRecords={totalRecords}
            currentPage={currentPage}
            searchQuery={searchQuery}
            onPageChange={handlePageChange}
            searchable={false}
          />
        </div>
      </div>
    </div>
  )
}
