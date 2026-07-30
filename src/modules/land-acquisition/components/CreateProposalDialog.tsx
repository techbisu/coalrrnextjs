'use client'

import * as React from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Plus, Loader2, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { proposalConfig } from '@/core/config/proposal.config'
import { useAuth } from '@/core/authorization/providers/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { AcquisitionMode, MODE_META, MODES } from '../types'
import { formatNumber } from '@/lib/utils/formatters'
import { useRouter } from 'next/navigation'
import { MasterLookup } from '@/components/coalrr/MasterLookup'
import { useAppTranslation } from '@/localization/hooks/useAppTranslation'

interface ProjectListItem {
  id: string
  name: string
  area_cd: string
  mine_cd: string
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
  const { user } = useAuth()
  const t = useAppTranslation('land_acquisition')
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
    proposal_no: '',
    description: '',
    mine_cd: '',
    adjacent_colliery: '',
    notification_date: '',
  })

  React.useEffect(() => {
    if (!form.project_id) return
    const p = lockedProjects.find((pr) => pr.id === form.project_id)
    if (p && !form.mine_cd) {
      setForm((f) => ({ ...f, mine_cd: (p as any).mine_cd || '' }))
    }
  }, [form.project_id, lockedProjects, form.mine_cd])

  const selectedProject = React.useMemo(() => 
    lockedProjects.find(p => p.id === form.project_id),
    [lockedProjects, form.project_id]
  )

  const create = useMutation({
    mutationFn: async () => {
      const selectedProject = lockedProjects.find(p => p.id === form.project_id)
      
      const r = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposal: {
            proposal_no: form.proposal_no || proposalConfig.fallbackProposalNoPrefix + Date.now(),
            proposal_dt: form.notification_date || new Date().toISOString(),
            mine_cd: form.mine_cd || selectedProject?.mine_cd || proposalConfig.fallbackMineCode,
            area_cd: selectedProject?.area_cd || proposalConfig.fallbackAreaCode,
            proj_cd: form.project_id,
            acq_mode_id: proposalConfig.acquisitionModeIdMap[form.acquisition_mode] || 1,
            purpose_justification: form.description,
            is_within_pr_limit: true,
            requires_board_approval: false,
            entry_by: user?.id || 'system'
          }
        }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'Failed to create proposal')
      return { id: data.proposalId, schedule_code: `PROP-${Date.now()}`, message: 'Drafting state — add plots & complete CL-1 checklist.' }
    },
    onSuccess: (data) => {
      toast.success(t('proposal_created_title'), {
        description: data.message ?? t('proposal_created_desc'),
      })
      setForm({
        project_id: '', acquisition_mode: '', proposal_no: '', description: '',
        mine_cd: '', adjacent_colliery: '', notification_date: '',
      })
      onOpenChange(false)
      // Refresh the page data (RSC) and navigate if needed
      router.refresh()
    },
    onError: (e: Error) => toast.error(e.message || t('proposal_create_error')),
  })

  const canSubmit = form.project_id && form.acquisition_mode && form.proposal_no.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('dialog_title')}</DialogTitle>
          <DialogDescription>
            {t('dialog_description')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {/* Project selector */}
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">{t('select_project')}</Label>
            {projectsLoading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> {t('loading_projects')}
              </div>
            ) : lockedProjects.length === 0 ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t('no_locked_projects_title')}</AlertTitle>
                <AlertDescription>
                  {t('no_locked_projects_desc')}
                </AlertDescription>
              </Alert>
            ) : (
              <select
                value={form.project_id}
                onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
              >
                <option value="">{t('select_locked_project')}</option>
                {lockedProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.mine_cd} · limit {formatNumber(p.total_land_limit_acres, 2)} ac
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Acquisition mode picker */}
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">{t('acquisition_mode')}</Label>
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
              <Label className="text-xs font-medium text-muted-foreground">{t('proposal_no')}</Label>
              <Input
                value={form.proposal_no || ''}
                onChange={(e) => setForm({ ...form, proposal_no: e.target.value })}
                placeholder={t('proposal_no_placeholder')}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">{t('notification_date')}</Label>
              <DatePicker
                value={form.notification_date ? new Date(form.notification_date) : undefined}
                onChange={(date) => setForm({ ...form, notification_date: date ? format(date, 'yyyy-MM-dd') : '' })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">{t('description')}</Label>
            <Textarea
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={t('description_placeholder')}
              className="min-h-16"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">{t('adjacent_colliery')}</Label>
            <MasterLookup
              masterName="area_master"
              isMulti={false}
              value={form.adjacent_colliery || ''}
              onChange={(v) => setForm({ ...form, adjacent_colliery: v as string })}
              placeholder={t('select_adjacent_area')}
              excludeValues={selectedProject?.area_cd ? [selectedProject.area_cd] : []}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
          <Button
            onClick={() => create.mutate()}
            disabled={!canSubmit || create.isPending}
          >
            {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {t('create_proposal')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
