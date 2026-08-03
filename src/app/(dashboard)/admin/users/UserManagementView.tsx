'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { SectionCard, DataTable, type Column } from '@/shared/components/coalrr'
import { Users, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { UserFormDialog } from './UserFormDialog'
import { UserAccessDialog } from './UserAccessDialog'
import { UserScopeDialog } from './UserScopeDialog'
import { deleteUserAction, toggleUserStatusAction } from '@/modules/admin/users/presentation/actions'
import { toast } from 'sonner'
import Link from 'next/link'
import { Badge } from '@/shared/components/ui/badge'
import { Switch } from '@/shared/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'

import { Input } from '@/shared/components/ui/input'
import { Search } from 'lucide-react'
import { usePathname, useSearchParams } from 'next/navigation'
import { BackButton } from '@/shared/components/ui/back-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/shared/components/ui/dropdown-menu'
import { MoreHorizontal, UserCheck, UserX, ShieldAlert } from 'lucide-react'

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
      header: '',
      render: (row: any) => (
        <div className="flex justify-end pr-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/admin/users/${row.id}`} className="cursor-pointer">
                  <Users className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <UserFormDialog
                mode="edit"
                initialData={row}
                onSuccess={handleMutationSuccess}
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit User
                  </DropdownMenuItem>
                }
              />
              <UserAccessDialog
                userId={row.id}
                userName={row.name}
                onSuccess={handleMutationSuccess}
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                    <ShieldAlert className="mr-2 h-4 w-4" />
                    Manage Access
                  </DropdownMenuItem>
                }
              />
              <UserScopeDialog
                userId={row.id}
                userName={row.name}
                currentScope={row.scope}
                onSuccess={handleMutationSuccess}
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                    <UserCheck className="mr-2 h-4 w-4" />
                    Manage Scope
                  </DropdownMenuItem>
                }
              />
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleDelete(row.id)}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]

  const verifiedUsers = activeTab === 'verified' ? initialData : []
  const unverifiedUsers = activeTab === 'unverified' ? initialData : []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-start gap-2">
          <BackButton iconOnly />
          <div>
            <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
            <p className="text-sm text-muted-foreground">Manage system users, roles, and access.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-none border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecords}</div>
            <p className="text-xs text-muted-foreground">Registered accounts</p>
          </CardContent>
        </Card>
        <Card className="shadow-none border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified / Active</CardTitle>
            <UserCheck className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecords - unverifiedCount}</div>
            <p className="text-xs text-muted-foreground">Approved users</p>
          </CardContent>
        </Card>
        <Card className="shadow-none border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Verification</CardTitle>
            <UserX className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unverifiedCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white dark:bg-slate-950 border rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Unified Toolbar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-80">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  defaultValue={searchQuery}
                  onChange={(e) => {
                    const timer = setTimeout(() => {
                      handleSearchChange(e.target.value)
                    }, 500)
                    return () => clearTimeout(timer)
                  }}
                  placeholder="Search users by name, email..."
                  className="pl-9 h-10 bg-white dark:bg-slate-950"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end shrink-0">
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full sm:w-auto">
                <TabsList className="bg-white dark:bg-slate-950 border h-10">
                  <TabsTrigger value="verified" className="px-4">Verified</TabsTrigger>
                  <TabsTrigger value="unverified" className="gap-1.5 px-4">
                    Unverified
                    {unverifiedCount > 0 && (
                      <Badge variant="secondary" className="h-4 px-1 text-[10px] bg-amber-100 text-amber-700 hover:bg-amber-100">
                        {unverifiedCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              <UserFormDialog mode="create" onSuccess={handleMutationSuccess} />
            </div>
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
  )
}
