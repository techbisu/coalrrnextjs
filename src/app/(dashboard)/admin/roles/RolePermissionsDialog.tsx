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
import { Loader2, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppTranslation } from '@/localization/hooks/useAppTranslation'

interface Permission {
  id: string
  name: string
  display_name: string | null
  module: string | null
  group: string | null
  description: string | null
}

interface RolePermissionsDialogProps {
  roleId: string
  roleName: string
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function RolePermissionsDialog({
  roleId,
  roleName,
  trigger,
  onSuccess,
}: RolePermissionsDialogProps) {
  const t = useAppTranslation('admin')
  const [open, setOpen] = React.useState(false)
  const [selected, setSelected] = React.useState<Set<string>>(new Set())

  // Fetch all permissions
  const { data: allPermissions = [], isLoading: loadingAll } = useQuery<Permission[]>({
    queryKey: ['all-permissions'],
    queryFn: async () => {
      const r = await fetch('/api/authorization/permissions')
      const json = await r.json()
      return Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : [])
    },
    enabled: open,
  })

  // Fetch current role permissions
  const { data: rolePermissions = [], isLoading: loadingRole } = useQuery<Permission[]>({
    queryKey: ['role-permissions', roleId],
    queryFn: async () => {
      const r = await fetch(`/api/authorization/roles/${roleId}/permissions`)
      const json = await r.json()
      return Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : [])
    },
    enabled: open,
  })

  // Pre-select current permissions once loaded
  React.useEffect(() => {
    if (open && rolePermissions.length >= 0 && !loadingRole) {
      setSelected(new Set(rolePermissions.map(p => p.id)))
    }
  }, [open, rolePermissions, loadingRole])

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/authorization/roles/${roleId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissionIds: Array.from(selected) }),
      })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error ?? 'Failed to save')
    },
    onSuccess: () => {
      toast.success(`Permissions updated for ${roleName}`)
      setOpen(false)
      onSuccess?.()
    },
    onError: (e: any) => toast.error(e.message),
  })

  // Group permissions by module
  const grouped = React.useMemo(() => {
    const map: Record<string, Permission[]> = {}
    for (const p of allPermissions) {
      const key = p.module || 'General'
      if (!map[key]) map[key] = []
      map[key].push(p)
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  }, [allPermissions])

  const togglePermission = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleModule = (perms: Permission[], checked: boolean) => {
    setSelected(prev => {
      const next = new Set(prev)
      for (const p of perms) {
        checked ? next.add(p.id) : next.delete(p.id)
      }
      return next
    })
  }

  const isLoading = loadingAll || loadingRole

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v) }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            {t('roles.permissions_btn', 'Permissions')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('roles.manage_permissions', 'Manage Permissions')} — {roleName}</DialogTitle>
          <DialogDescription>
            {t('roles.manage_permissions_desc', 'Select the permissions this role should have. Changes apply immediately on save.')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            grouped.map(([module, perms]) => {
              const allChecked = perms.every(p => selected.has(p.id))
              const someChecked = perms.some(p => selected.has(p.id))
              return (
                <div key={module} className="rounded-lg border">
                  {/* Module header with select-all */}
                  <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-t-lg border-b">
                    <Checkbox
                      checked={allChecked}
                      onCheckedChange={(v) => toggleModule(perms, !!v)}
                      className={cn(!allChecked && someChecked && 'opacity-60')}
                    />
                    <span className="text-sm font-semibold capitalize">{module}</span>
                    <Badge variant="secondary" className="ml-auto text-[10px] h-5">
                      {perms.filter(p => selected.has(p.id)).length}/{perms.length}
                    </Badge>
                  </div>
                  {/* Permissions grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-4">
                    {perms.map(p => (
                      <label
                        key={p.id}
                        className="flex items-start gap-3 p-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
                      >
                        <Checkbox
                          checked={selected.has(p.id)}
                          onCheckedChange={() => togglePermission(p.id)}
                          className="mt-0.5"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-none text-foreground">{p.display_name || p.name}</p>
                          <p className="text-xs font-mono text-muted-foreground mt-1 truncate">{p.name}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>

        <DialogFooter className="gap-2 border-t pt-4 mt-auto">
          <span className="text-xs font-medium text-muted-foreground mr-auto mt-2">
            {selected.size} {t('roles.permissions_selected', 'permission(s) selected')}
          </span>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button onClick={() => save()} disabled={saving || isLoading}>
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('common.saving', 'Saving...')} </> : t('roles.save_permissions', 'Save Permissions')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
