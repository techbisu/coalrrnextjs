'use client'

import * as React from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Plus, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { AcquisitionMode, MODE_META, MODES } from '../types'
import { formatNumber } from '@/lib/utils/formatters'
import { useRouter } from 'next/navigation'

interface ProjectListItem {
  id: string
  name: string
  colliery_code: string
  isLocked: boolean
  total_land_limit_acres: string
}

async function fetchProjects(): Promise<ProjectListItem[]> {
  const r = await fetch('/api/projects')
  if (!r.ok) throw new Error('Failed to load projects')
  const json = await r.json()
  return json.data || json
}

export function CreateProposalDialog({
  open, onOpenChange,
}: {
  open: boolean
  onOpenChange: (b: boolean) => void
}) {
  const router = useRouter()
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
    enabled: open,
  })

  const lockedProjects = React.useMemo(
    () => (projects ?? []).filter((p) => p.isLocked),
    [projects],
  )

  const [form, setForm] = React.useState({
    project_id: '',
    acquisition_mode: '' as AcquisitionMode | '',
    proposal_title: '',
    description: '',
    area_office: '',
    colliery_code: '',
    adjacent_colliery: '',
    notification_date: '',
  })

  React.useEffect(() => {
    if (!form.project_id) return
    const p = lockedProjects.find((pr) => pr.id === form.project_id)
    if (p && !form.colliery_code) {
      setForm((f) => ({ ...f, colliery_code: p.colliery_code }))
    }
  }, [form.project_id, lockedProjects, form.colliery_code])

  const create = useMutation({
    mutationFn: async () => {
      const r = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: form.project_id,
          acquisition_mode: form.acquisition_mode,
          proposal_title: form.proposal_title,
          description: form.description,
          area_office: form.area_office,
          colliery_code: form.colliery_code,
          adjacent_colliery: form.adjacent_colliery,
          notification_date: form.notification_date || undefined,
        }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'Failed to create proposal')
      return data as { id: string; schedule_code: string; message?: string }
    },
    onSuccess: (data) => {
      toast.success(`Proposal ${data.schedule_code} created`, {
        description: data.message ?? 'Drafting state — add plots & complete CL-1 checklist.',
      })
      setForm({
        project_id: '', acquisition_mode: '', proposal_title: '', description: '',
        area_office: '', colliery_code: '', adjacent_colliery: '', notification_date: '',
      })
      onOpenChange(false)
      // Refresh the page data (RSC) and navigate if needed
      router.refresh()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const canSubmit = form.project_id && form.acquisition_mode && form.proposal_title.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Land Acquisition Proposal</DialogTitle>
          <DialogDescription>
            Create a schedule against a locked project baseline. Mode drives the CL-1.x checklist
            enforced at area vetting.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {/* Project selector */}
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">Project (locked baseline only)</Label>
            {projectsLoading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Loading projects…
              </div>
            ) : lockedProjects.length === 0 ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No locked projects available</AlertTitle>
                <AlertDescription>
                  A project baseline must be locked before acquisition proposals can be raised against it.
                </AlertDescription>
              </Alert>
            ) : (
              <select
                value={form.project_id}
                onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
              >
                <option value="">Select a locked project…</option>
                {lockedProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.colliery_code} · limit {formatNumber(p.total_land_limit_acres, 2)} ac
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Acquisition mode picker */}
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">Acquisition Mode (drives CL-1.x checklist)</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {MODES.map((m) => {
                const meta = MODE_META[m]
                const selected = form.acquisition_mode === m
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setForm({ ...form, acquisition_mode: m })}
                    className={`flex flex-col items-start rounded-md border px-3 py-2 text-left transition ${
                      selected ? meta.color + ' ring-2 ring-offset-1 ring-amber-300' : 'border-border bg-card hover:border-amber-300'
                    }`}
                  >
                    <span className="font-mono text-[10px] font-bold uppercase">{meta.checklistCode}</span>
                    <span className="mt-0.5 text-xs font-medium leading-tight">{meta.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">Proposal Title</Label>
              <Input
                value={form.proposal_title}
                onChange={(e) => setForm({ ...form, proposal_title: e.target.value })}
                placeholder="e.g. Hingula Phase-III acquisition — 42 acres"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">Notification Date</Label>
              <Input
                type="date"
                value={form.notification_date}
                onChange={(e) => setForm({ ...form, notification_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief scope, affected mouzas, rationale…"
              className="min-h-16"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">Area Office</Label>
              <Input
                value={form.area_office}
                onChange={(e) => setForm({ ...form, area_office: e.target.value })}
                placeholder="e.g. Talcher Area"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">Acquiring Colliery Code</Label>
              <Input
                value={form.colliery_code}
                onChange={(e) => setForm({ ...form, colliery_code: e.target.value })}
                placeholder="e.g. HNG"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">Adjacent Colliery</Label>
              <Input
                value={form.adjacent_colliery}
                onChange={(e) => setForm({ ...form, adjacent_colliery: e.target.value })}
                placeholder="e.g. BNP"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => create.mutate()}
            disabled={!canSubmit || create.isPending}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create Proposal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
