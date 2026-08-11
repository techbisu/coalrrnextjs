'use client'

import * as React from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Plus, Loader2, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react'
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
import { MODE_META, STANDARD_ACQ_MODES } from '../types'
import { ACQ_MODE_ID } from '@/core/config/module-codes.config'
import { useRouter } from 'next/navigation'
import { ProjectSelect } from '@/shared/components/coalrr/selects'
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
    acq_mode_id: ACQ_MODE_ID.DIRECT_PURCHASE as number | '',
    proposal_type: 'STANDARD_LAP' as 'STANDARD_LAP' | 'DRAFT_PR_CHECKLIST_1_4',
    proposal_no: '',
    description: '',
    mine_cd: '',
    notification_date: '',
    rate_tenancy_land_with_emp: 0,
    rate_tenancy_land_no_emp: 0,
    rate_govt_land: 0,
    rate_forest_land: 0,
    employment_proposed_count: 0,
    employment_system: 'PACKAGE_DEAL',
  })

  React.useEffect(() => {
    if (!form.project_id) return
    const p = lockedProjects.find((pr) => pr.id === form.project_id)
    if (p && !form.mine_cd) {
      setForm((f) => ({ ...f, mine_cd: (p as any).mine_cd || '' }))
    }
  }, [form.project_id, lockedProjects, form.mine_cd])

  React.useEffect(() => {
    async function fetchGeneratedRefNo() {
      if (!form.project_id) return
      
      const isDraft = form.proposal_type === 'DRAFT_PR_CHECKLIST_1_4'
      const acqMode = form.acq_mode_id

      if (!isDraft && !acqMode) return

      try {
        const res = await fetch('/api/proposals/generate-ref', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: form.project_id,
            acq_mode_id: acqMode,
            is_draft: isDraft
          })
        })
        if (res.ok) {
          const data = await res.json()
          if (data.refNo) {
            setForm(f => ({ ...f, proposal_no: data.refNo }))
          }
        }
      } catch (err) {
        console.error('Failed to generate proposal ref no', err)
      }
    }
    
    // Only auto-generate if it hasn't been manually typed yet or if it's following the auto-generated pattern
    if (!form.proposal_no || form.proposal_no.includes('ACQ/') || form.proposal_no.includes('DRAFT/')) {
      fetchGeneratedRefNo()
    }
  }, [form.project_id, form.acq_mode_id, form.proposal_type])

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
          acq_mode_id: form.proposal_type === 'DRAFT_PR_CHECKLIST_1_4' 
            ? ACQ_MODE_ID.DIRECT_PURCHASE 
            : Number(form.acq_mode_id),
          proposal_type: form.proposal_type,
          purpose_justification: form.description,
          rate_tenancy_land_with_emp: Number(form.rate_tenancy_land_with_emp),
          rate_tenancy_land_no_emp: Number(form.rate_tenancy_land_no_emp),
          rate_govt_land: Number(form.rate_govt_land),
          rate_forest_land: Number(form.rate_forest_land),
          employment_proposed_count: Number(form.employment_proposed_count),
          employment_system: form.employment_system,
          has_debottar_land: false,
          has_tribal_land: false,
          has_formal_negotiation: false,
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
        project_id: '', acq_mode_id: ACQ_MODE_ID.DIRECT_PURCHASE, proposal_type: 'STANDARD_LAP', proposal_no: '', description: '',
        mine_cd: '', notification_date: '',
        rate_tenancy_land_with_emp: 0, rate_tenancy_land_no_emp: 0, rate_govt_land: 0, rate_forest_land: 0,
        employment_proposed_count: 0, employment_system: 'PACKAGE_DEAL',
      })
      onOpenChange(false)
      router.refresh()
    },
    onError: (e: Error) => toast.error(e.message || t('proposal_create_error')),
  })

  const canAdvanceStep1 = form.proposal_type === 'DRAFT_PR_CHECKLIST_1_4' 
    ? Boolean(form.project_id && form.proposal_no.trim())
    : Boolean(form.project_id && form.acq_mode_id && form.proposal_no.trim())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Initiate Land Acquisition Proposal</DialogTitle>
          <DialogDescription>
            Step {step} of 2 — Enter primary proposal parameters and compensation rates.
          </DialogDescription>

          {/* Stepper Progress Bar */}
          <div className="mt-2 flex items-center justify-between border-b pb-3 text-xs font-medium text-muted-foreground">
            <div className={`flex items-center gap-1.5 ${step >= 1 ? 'font-bold text-amber-600' : ''}`}>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[11px] text-amber-800 font-bold">1</span>
              Mode & Basic Info
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            <div className={`flex items-center gap-1.5 ${step >= 2 ? 'font-bold text-amber-600' : ''}`}>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[11px] text-amber-800 font-bold">2</span>
              Per-Acre Rates & Justification
            </div>
          </div>
        </DialogHeader>

        <div className="py-2">
          {/* STEP 1: Primary Creation Mode & Project Selector */}
          {step === 1 && (
            <div className="grid gap-4">
              {/* Proposal Type Selector */}
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
                <ProjectSelect
                  lockedOnly
                  value={form.project_id}
                  onChange={(val) => setForm({ ...form, project_id: typeof val === 'string' ? val : (Array.isArray(val) ? val[0] : '') })}
                  placeholder="Select the Approved Project "
                />
                )}
              </div>

              {/* Acquisition mode picker — only shown for Standard Acquisition Proposals */}
              {form.proposal_type === 'STANDARD_LAP' && (
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">Primary Acquisition Mode</Label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {STANDARD_ACQ_MODES.map((m) => {
                      const meta = MODE_META[m]
                      const selected = form.acq_mode_id === m
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setForm({ ...form, acq_mode_id: m })}
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
              )}

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
            </div>
          )}

          {/* STEP 2: Per-Acre Compensation Rates & Justification */}
          {step === 2 && (
            <div className="grid gap-4">
              <Alert className="bg-amber-50/50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-xs font-semibold text-amber-900">Techno-Economic Parameters (Form-XXII)</AlertTitle>
                <AlertDescription className="text-xs text-amber-800">
                  Enter proposed per-acre compensation rates for land valuation estimates. Exceptional case flags (Debottar, Tribal) are configured inside the proposal workspace later if applicable.
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
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">Rate of Tenancy Land/Acre (without Employment) [₹]</Label>
                  <Input
                    type="number"
                    value={form.rate_tenancy_land_no_emp}
                    onChange={(e) => setForm({ ...form, rate_tenancy_land_no_emp: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">Rate of Government Land/Acre (Transfer Value) [₹]</Label>
                  <Input
                    type="number"
                    value={form.rate_govt_land}
                    onChange={(e) => setForm({ ...form, rate_govt_land: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">Rate of Forest Land/Acre (NPV / CA) [₹]</Label>
                  <Input
                    type="number"
                    value={form.rate_forest_land}
                    onChange={(e) => setForm({ ...form, rate_forest_land: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">Inevitable Justification for Land Acquisition (Form-XXII Item 8)</Label>
                <Textarea
                  value={form.description || ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Explain why the proposed procurement of land is inevitable for mine expansion..."
                  className="min-h-16 text-xs"
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

          {step < 2 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canAdvanceStep1}>
              Next Step <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={() => create.mutate()}
              disabled={create.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
              Initiate Land Proposal
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
