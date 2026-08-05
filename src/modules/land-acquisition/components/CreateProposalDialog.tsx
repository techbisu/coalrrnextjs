'use client'

import * as React from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Plus, Loader2, AlertCircle, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { proposalConfig } from '@/core/config/proposal.config'
import { useAuth } from '@/core/authorization/providers/AuthProvider'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { DatePicker } from '@/shared/components/ui/date-picker'
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/shared/components/ui/dialog'
import { AcquisitionMode, MODE_META, MODES } from '../types'
import { formatNumber } from '@/lib/utils/formatters'
import { useRouter } from 'next/navigation'
import { MasterLookup } from '@/shared/components/coalrr/MasterLookup'
import { useAppTranslation } from '@/localization/hooks/useAppTranslation'

interface ProjectListItem {
  id: string
  name: string
  area_cd: string
  mine_cd: string
  isLocked: boolean
  total_land_limit_acres: string
  is_combo_project?: boolean
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
  const [step, setStep] = React.useState<number>(1)

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
    acquisition_mode: 'direct_purchase' as AcquisitionMode | '',
    proposal_type: 'STANDARD_LAP' as 'STANDARD_LAP' | 'DRAFT_PR_CHECKLIST_1_4',
    proposal_no: '',
    description: '',
    mine_cd: '',
    adjacent_colliery: '',
    notification_date: '',
    rate_tenancy_land_with_emp: 0,
    rate_tenancy_land_no_emp: 0,
    rate_govt_land: 0,
    rate_forest_land: 0,
    employment_proposed_count: 0,
    employment_system: 'PACKAGE_DEAL',
    has_debottar_land: false,
    has_tribal_land: false,
    has_formal_negotiation: false,
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
          proposal_no: form.proposal_no || proposalConfig.fallbackProposalNoPrefix + Date.now(),
          proposal_dt: form.notification_date || new Date().toISOString(),
          mine_cd: form.mine_cd || selectedProject?.mine_cd || proposalConfig.fallbackMineCode,
          area_cd: selectedProject?.area_cd || proposalConfig.fallbackAreaCode,
          proj_cd: form.project_id,
          acq_mode_id: proposalConfig.acquisitionModeIdMap[form.acquisition_mode as keyof typeof proposalConfig.acquisitionModeIdMap] || 6,
          proposal_type: form.proposal_type,
          purpose_justification: form.description,
          rate_tenancy_land_with_emp: Number(form.rate_tenancy_land_with_emp),
          rate_tenancy_land_no_emp: Number(form.rate_tenancy_land_no_emp),
          rate_govt_land: Number(form.rate_govt_land),
          rate_forest_land: Number(form.rate_forest_land),
          employment_proposed_count: Number(form.employment_proposed_count),
          employment_system: form.employment_system,
          has_debottar_land: form.has_debottar_land,
          has_tribal_land: form.has_tribal_land,
          has_formal_negotiation: form.has_formal_negotiation,
        }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'Failed to create proposal')
      return { id: data.proposalId, schedule_code: `PROP-${Date.now()}`, message: 'Proposal created successfully.' }
    },
    onSuccess: (data) => {
      toast.success(t('proposal_created_title'), {
        description: data.message ?? t('proposal_created_desc'),
      })
      setStep(1)
      setForm({
        project_id: '', acquisition_mode: 'direct_purchase', proposal_type: 'STANDARD_LAP', proposal_no: '', description: '',
        mine_cd: '', adjacent_colliery: '', notification_date: '',
        rate_tenancy_land_with_emp: 0, rate_tenancy_land_no_emp: 0, rate_govt_land: 0, rate_forest_land: 0,
        employment_proposed_count: 0, employment_system: 'PACKAGE_DEAL',
        has_debottar_land: false, has_tribal_land: false, has_formal_negotiation: false,
      })
      onOpenChange(false)
      router.refresh()
    },
    onError: (e: Error) => toast.error(e.message || t('proposal_create_error')),
  })

  const canAdvanceStep1 = form.project_id && form.acquisition_mode && form.proposal_no.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Initiate Land Acquisition Proposal</DialogTitle>
          <DialogDescription>
            Step {step} of 3 — Enter proposal parameters and SOP requirements.
          </DialogDescription>

          {/* Stepper Progress Bar */}
          <div className="mt-2 flex items-center justify-between border-b pb-3 text-xs font-medium text-muted-foreground">
            <div className={`flex items-center gap-1.5 ${step >= 1 ? 'font-bold text-amber-600' : ''}`}>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[11px] text-amber-800">1</span>
              Mode & Basic Info
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            <div className={`flex items-center gap-1.5 ${step >= 2 ? 'font-bold text-amber-600' : ''}`}>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[11px] text-amber-800">2</span>
              Per-Acre Rates
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            <div className={`flex items-center gap-1.5 ${step >= 3 ? 'font-bold text-amber-600' : ''}`}>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[11px] text-amber-800">3</span>
              SOP Exceptional Cases
            </div>
          </div>
        </DialogHeader>

        <div className="py-2">
          {/* STEP 1: Primary Creation Mode & Project Selector */}
          {step === 1 && (
            <div className="grid gap-4">
              {/* Proposal Type Selector (Standard vs Draft PR Stage) */}
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">Proposal Workflow Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, proposal_type: 'STANDARD_LAP' })}
                    className={`rounded-md border p-2 text-left text-xs transition ${
                      form.proposal_type === 'STANDARD_LAP' ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30' : 'border-border'
                    }`}
                  >
                    <div className="font-semibold text-foreground">Standard Acquisition Proposal</div>
                    <div className="text-[11px] text-muted-foreground">Against approved Project Report baseline</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm({ ...form, proposal_type: 'DRAFT_PR_CHECKLIST_1_4' })}
                    className={`rounded-md border p-2 text-left text-xs transition ${
                      form.proposal_type === 'DRAFT_PR_CHECKLIST_1_4' ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30' : 'border-border'
                    }`}
                  >
                    <div className="font-semibold text-amber-700 dark:text-amber-400">Draft PR Stage (Checklist 1.4)</div>
                    <div className="text-[11px] text-muted-foreground">Incorporates land into Draft Project Report before Board sanction</div>
                  </button>
                </div>
              </div>

              {/* Project selector */}
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">Target Mining Project</Label>
                {projectsLoading ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> Loading projects...
                  </div>
                ) : lockedProjects.length === 0 ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Locked Projects Found</AlertTitle>
                    <AlertDescription>
                      You need at least one locked Project PR Report baseline to initiate a land proposal.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <select
                    value={form.project_id}
                    onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                    className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                  >
                    <option value="">Select Project</option>
                    {lockedProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} · Mine: {p.mine_cd} {p.is_combo_project ? '· [COMBO MINE PROJECT]' : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Acquisition mode picker */}
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">Primary Acquisition Mode</Label>
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
                          selected ? meta.color + ' ring-2 ring-offset-1 ring-amber-400' : 'border-border bg-card hover:border-amber-300'
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
                  <Label className="text-xs font-medium text-muted-foreground">Proposal Reference No.</Label>
                  <Input
                    value={form.proposal_no || ''}
                    onChange={(e) => setForm({ ...form, proposal_no: e.target.value })}
                    placeholder="e.g. PROP/2026/001"
                  />
                  <div className="min-h-[1.25rem] text-[11px] text-destructive">
                    {!form.proposal_no && 'Proposal reference number is required'}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">Notification / Proposal Date</Label>
                  <DatePicker
                    value={form.notification_date ? new Date(form.notification_date) : undefined}
                    onChange={(date) => setForm({ ...form, notification_date: date ? format(date, 'yyyy-MM-dd') : '' })}
                  />
                  <div className="min-h-[1.25rem]"></div>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">Inevitable Justification for Land Acquisition (Form-XXII Item 8)</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Explain why the proposed procurement of land is inevitable for mine expansion and operational continuity..."
                  rows={3}
                />
                <div className="min-h-[1.25rem] text-[11px] text-muted-foreground">
                  This justification will populate Form-XXII Item 8.
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Per-Acre Compensation Rates */}
          {step === 2 && (
            <div className="grid gap-4">
              <Alert className="bg-amber-50/50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-xs font-semibold text-amber-900">Techno-Economic Calculation Sheet Parameters</AlertTitle>
                <AlertDescription className="text-xs text-amber-800">
                  Enter proposed per-acre compensation rates for land estimation in Form-XXII Item 10.
                </AlertDescription>
              </Alert>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">Rate of Tenancy Land/Acre (with Employment) [₹]</Label>
                  <Input
                    type="number"
                    value={form.rate_tenancy_land_with_emp}
                    onChange={(e) => setForm({ ...form, rate_tenancy_land_with_emp: parseFloat(e.target.value) || 0 })}
                  />
                  <div className="min-h-[1.25rem]"></div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">Rate of Tenancy Land/Acre (without Employment) [₹]</Label>
                  <Input
                    type="number"
                    value={form.rate_tenancy_land_no_emp}
                    onChange={(e) => setForm({ ...form, rate_tenancy_land_no_emp: parseFloat(e.target.value) || 0 })}
                  />
                  <div className="min-h-[1.25rem]"></div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">Rate of Government Land/Acre (Transfer Value) [₹]</Label>
                  <Input
                    type="number"
                    value={form.rate_govt_land}
                    onChange={(e) => setForm({ ...form, rate_govt_land: parseFloat(e.target.value) || 0 })}
                  />
                  <div className="min-h-[1.25rem]"></div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">Rate of Forest Land/Acre (NPV / CA) [₹]</Label>
                  <Input
                    type="number"
                    value={form.rate_forest_land}
                    onChange={(e) => setForm({ ...form, rate_forest_land: parseFloat(e.target.value) || 0 })}
                  />
                  <div className="min-h-[1.25rem]"></div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SOP Exceptional Case Toggles & Employment */}
          {step === 3 && (
            <div className="grid gap-4">
              <div className="space-y-3 rounded-md border p-3 bg-card">
                <Label className="text-xs font-bold text-foreground">SOP Exceptional Case Declarations</Label>
                
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.has_debottar_land}
                    onChange={(e) => setForm({ ...form, has_debottar_land: e.target.checked })}
                    className="h-4 w-4 rounded border-border"
                  />
                  <span><strong>Debottar Land (Deity Land) Involved</strong> — Mandates Board of Revenue / District Judge Approval</span>
                </label>

                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.has_tribal_land}
                    onChange={(e) => setForm({ ...form, has_tribal_land: e.target.checked })}
                    className="h-4 w-4 rounded border-border"
                  />
                  <span><strong>Tribal Land Involved (CNT / SPT Act)</strong> — Mandates District Authority Transfer Approval</span>
                </label>

                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.has_formal_negotiation}
                    onChange={(e) => setForm({ ...form, has_formal_negotiation: e.target.checked })}
                    className="h-4 w-4 rounded border-border"
                  />
                  <span><strong>Formal Rate Negotiation Held</strong> — Mandates uploading Tripartite Minutes of Meeting</span>
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">Proposed Employment Jobs Count</Label>
                  <Input
                    type="number"
                    value={form.employment_proposed_count}
                    onChange={(e) => setForm({ ...form, employment_proposed_count: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">Employment Package System</Label>
                  <select
                    value={form.employment_system}
                    onChange={(e) => setForm({ ...form, employment_system: e.target.value })}
                    className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                  >
                    <option value="PACKAGE_DEAL">Package Deal (CIL R&R Policy)</option>
                    <option value="TAGGED">Tagged Plot Scheme</option>
                    <option value="NONE">No Employment (Direct Cash Compensation)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">Purpose & Justification</Label>
                <Textarea
                  value={form.description || ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Enter proposal justification for Form-XXII Item 8..."
                  className="min-h-16"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous Step
            </Button>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          )}

          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canAdvanceStep1}>
              Next Step <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={() => create.mutate()}
              disabled={create.isPending}
            >
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
              Submit Land Proposal
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
