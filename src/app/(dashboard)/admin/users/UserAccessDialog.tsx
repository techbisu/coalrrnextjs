'use client'

import * as React from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, KeyRound, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Role {
  id: string
  name: string
  display_name: string | null
  description: string | null
  is_system: boolean
}

interface Permission {
  id: string
  name: string
  display_name: string | null
  module: string | null
  group: string | null
}

interface UserAccessDialogProps {
  userId: string
  userName: string
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function UserAccessDialog({
  userId,
  userName,
  trigger,
  onSuccess,
}: UserAccessDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedRoles, setSelectedRoles] = React.useState<Set<string>>(new Set())
  const [selectedPerms, setSelectedPerms] = React.useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = React.useState('roles')

  // All roles
  const { data: allRoles = [], isLoading: loadingAllRoles } = useQuery<Role[]>({
    queryKey: ['all-roles'],
    queryFn: async () => {
      const r = await fetch('/api/authorization/roles')
      const json = await r.json()
      return Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : [])
    },
    enabled: open,
  })

  // User's current roles
  const { data: userRoles = [], isLoading: loadingUserRoles } = useQuery<Role[]>({
    queryKey: ['user-roles', userId],
    queryFn: async () => {
      const r = await fetch(`/api/authorization/users/${userId}/roles`)
      const json = await r.json()
      return Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : [])
    },
    enabled: open,
  })

  // All permissions
  const { data: allPermissions = [], isLoading: loadingAllPerms } = useQuery<Permission[]>({
    queryKey: ['all-permissions'],
    queryFn: async () => {
      const r = await fetch('/api/authorization/permissions')
      const json = await r.json()
      return Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : [])
    },
    enabled: open,
  })

  // User's current direct permissions
  const { data: userPermissions = [], isLoading: loadingUserPerms } = useQuery<Permission[]>({
    queryKey: ['user-permissions', userId],
    queryFn: async () => {
      const r = await fetch(`/api/authorization/users/${userId}/permissions`)
      const json = await r.json()
      return Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : [])
    },
    enabled: open,
  })

  const isLoadingRoles = loadingAllRoles || loadingUserRoles
  const isLoadingPerms = loadingAllPerms || loadingUserPerms

  // Seed selections once data is loaded
  React.useEffect(() => {
    if (open && !loadingUserRoles) {
      setSelectedRoles(new Set(userRoles.map(r => r.id)))
    }
  }, [open, userRoles, loadingUserRoles])

  React.useEffect(() => {
    if (open && !loadingUserPerms) {
      setSelectedPerms(new Set(userPermissions.map(p => p.id)))
    }
  }, [open, userPermissions, loadingUserPerms])

  // Save roles
  const { mutate: saveRoles, isPending: savingRoles } = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/authorization/users/${userId}/roles`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleIds: Array.from(selectedRoles) }),
      })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error ?? 'Failed to save roles')
    },
    onSuccess: () => { toast.success(`Roles updated for ${userName}`); onSuccess?.() },
    onError: (e: any) => toast.error(e.message),
  })

  // Save direct permissions
  const { mutate: savePerms, isPending: savingPerms } = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/authorization/users/${userId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissionIds: Array.from(selectedPerms) }),
      })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error ?? 'Failed to save permissions')
    },
    onSuccess: () => { toast.success(`Direct permissions updated for ${userName}`); onSuccess?.() },
    onError: (e: any) => toast.error(e.message),
  })

  // Group permissions by module
  const groupedPerms = React.useMemo(() => {
    const map: Record<string, Permission[]> = {}
    for (const p of allPermissions) {
      const key = p.module || 'General'
      if (!map[key]) map[key] = []
      map[key].push(p)
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  }, [allPermissions])

  const toggleRole = (id: string) => setSelectedRoles(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next
  })
  const togglePerm = (id: string) => setSelectedPerms(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next
  })
  const toggleModulePerms = (perms: Permission[], checked: boolean) => setSelectedPerms(prev => {
    const next = new Set(prev)
    for (const p of perms) { checked ? next.add(p.id) : next.delete(p.id) }
    return next
  })

  const isSaving = savingRoles || savingPerms

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
            <KeyRound className="h-3.5 w-3.5" />
            Access
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[580px] max-h-[82vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Access — {userName}</DialogTitle>
          <DialogDescription>
            Assign roles or direct permissions to this user. Role-based permissions inherit automatically.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2 mb-3">
            <TabsTrigger value="roles" className="gap-2">
              <ShieldCheck className="h-4 w-4" /> Roles
              {selectedRoles.size > 0 && (
                <Badge variant="secondary" className="h-4 px-1 text-[10px]">{selectedRoles.size}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="permissions" className="gap-2">
              <KeyRound className="h-4 w-4" /> Direct Permissions
              {selectedPerms.size > 0 && (
                <Badge variant="secondary" className="h-4 px-1 text-[10px]">{selectedPerms.size}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ROLES TAB */}
          <TabsContent value="roles" className="flex-1 overflow-y-auto space-y-1 pr-1 mt-0">
            {isLoadingRoles ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="rounded-lg border divide-y">
                {allRoles.map(role => (
                  <label key={role.id} className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors">
                    <Checkbox
                      checked={selectedRoles.has(role.id)}
                      onCheckedChange={() => toggleRole(role.id)}
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{role.display_name || role.name}</p>
                        {role.is_system && (
                          <Badge variant="outline" className="text-[9px] h-4 px-1">System</Badge>
                        )}
                      </div>
                      <p className="text-xs font-mono text-muted-foreground">{role.name}</p>
                    </div>
                  </label>
                ))}
                {allRoles.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No roles found.</p>
                )}
              </div>
            )}
          </TabsContent>

          {/* DIRECT PERMISSIONS TAB */}
          <TabsContent value="permissions" className="flex-1 overflow-y-auto space-y-3 pr-1 mt-0">
            {isLoadingPerms ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              groupedPerms.map(([module, perms]) => {
                const allChecked = perms.every(p => selectedPerms.has(p.id))
                const someChecked = perms.some(p => selectedPerms.has(p.id))
                return (
                  <div key={module} className="rounded-lg border">
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-muted/40 rounded-t-lg border-b">
                      <Checkbox
                        checked={allChecked}
                        onCheckedChange={(v) => toggleModulePerms(perms, !!v)}
                        className={cn(!allChecked && someChecked && 'opacity-60')}
                      />
                      <span className="text-sm font-semibold">{module}</span>
                      <Badge variant="outline" className="ml-auto text-[10px] h-5">
                        {perms.filter(p => selectedPerms.has(p.id)).length}/{perms.length}
                      </Badge>
                    </div>
                    <div className="divide-y">
                      {perms.map(p => (
                        <label key={p.id} className="flex items-start gap-3 px-4 py-2 cursor-pointer hover:bg-muted/30 transition-colors">
                          <Checkbox
                            checked={selectedPerms.has(p.id)}
                            onCheckedChange={() => togglePerm(p.id)}
                            className="mt-0.5"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-mono leading-none">{p.name}</p>
                            {p.display_name && (
                              <p className="text-xs text-muted-foreground mt-0.5">{p.display_name}</p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 border-t pt-4">
          {activeTab === 'roles' ? (
            <>
              <span className="text-xs text-muted-foreground mr-auto">
                {selectedRoles.size} role{selectedRoles.size !== 1 ? 's' : ''} selected
              </span>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>Cancel</Button>
              <Button onClick={() => saveRoles()} disabled={isSaving || isLoadingRoles}>
                {savingRoles ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save Roles'}
              </Button>
            </>
          ) : (
            <>
              <span className="text-xs text-muted-foreground mr-auto">
                {selectedPerms.size} direct permission{selectedPerms.size !== 1 ? 's' : ''} selected
              </span>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>Cancel</Button>
              <Button onClick={() => savePerms()} disabled={isSaving || isLoadingPerms}>
                {savingPerms ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save Permissions'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
