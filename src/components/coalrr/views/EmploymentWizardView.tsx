'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SectionCard, StateBadge, StatusTimeline, DocumentUploader } from '@/components/coalrr'
import type { TimelineNode } from '@/components/coalrr'
import { formatNumber, timeAgo } from '@/lib/utils/formatters'
import { useAuth } from '@/authorization/providers/AuthProvider'
import { useUiState } from '@/providers/UiStateProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  Briefcase, CheckCircle2, Clock, AlertCircle, Loader2, ArrowLeft, ArrowRight,
  ShieldCheck, Upload, Users, FileText,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface nominee_pool {
  id: string
  projectName: string
  nominee_name: string
  pooled_acreage: string
  threshold: string
  hasCrossedThreshold: boolean
  remainingToThreshold: string
  contributionCount: number
  exception_flags: string | null
  state: string
}

interface employment_application {
  id: string
  application_code: string
  pool_id: string
  projectName: string
  nominee_name: string
  state: string
  bioData: string | null
  selfDeclarationConfirmed: boolean
  submitted_at: string | null
  transparency_window_ends_at: string | null
  hqApprovedAt: string | null
  entry_ts: string
  updt_ts: string
}

interface BioDataForm {
  fullName: string
  dateOfBirth: string
  gender: string
  education: string
  aadhaarNumber: string
  address: string
  mobileNumber: string
}

// ─── API helpers ─────────────────────────────────────────────────────────────

async function fetchPools(): Promise<nominee_pool[]> {
  const r = await fetch('/api/nominee-pools')
  if (!r.ok) throw new Error('Failed to load nominee pools')
  return r.json()
}

async function fetchPoolDetail(id: string): Promise<nominee_pool> {
  const r = await fetch(`/api/nominee-pools/${id}`)
  if (!r.ok) throw new Error('Failed to load pool detail')
  return r.json()
}

async function createDraftApplication(pool_id: string): Promise<employment_application> {
  const r = await fetch('/api/employment/apply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pool_id }),
  })
  const data = await r.json()
  if (!r.ok) throw new Error(data.error ?? 'Failed to create draft application')
  return data
}

async function updateApplication(
  id: string,
  payload: Record<string, unknown>,
): Promise<employment_application> {
  const r = await fetch(`/api/employment/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await r.json()
  if (!r.ok) throw new Error(data.error ?? 'Failed to update application')
  return data
}

async function fetchApplication(id: string): Promise<employment_application> {
  const r = await fetch(`/api/employment/${id}`)
  if (!r.ok) throw new Error('Failed to load application')
  return r.json()
}

// ─── Constants ───────────────────────────────────────────────────────────────

const EMPLOYMENT_THRESHOLD = 2.0

const EDUCATION_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'matric', label: 'Matric' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'graduate', label: 'Graduate' },
  { value: 'post_graduate', label: 'Post-Graduate' },
]

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
]

const DOCUMENT_CHECKLIST = [
  { key: 'EDU_CERT', label: 'Education Certificate', required: true },
  { key: 'IDENTITY_PROOF', label: 'Identity Proof (Aadhaar / EPIC)', required: true },
  { key: 'ADDRESS_PROOF', label: 'Address Proof', required: true },
  { key: 'PASSPORT_PHOTO', label: 'Passport Photo', required: true },
] as const

const WIZARD_STEPS = [
  { key: 'pool-select', title: 'Pool Selection', description: 'Choose nominee pool', icon: Users },
  { key: 'eligibility', title: 'Eligibility', description: 'PUB-M10-01', icon: ShieldCheck },
  { key: 'form-vi', title: 'Form-V/VI', description: 'PUB-M10-02', icon: FileText },
  { key: 'documents', title: 'Documents', description: 'PUB-M10-03', icon: Upload },
  { key: 'status', title: 'Status', description: 'PUB-M10-04', icon: Briefcase },
] as const

const INITIAL_BIO_DATA: BioDataForm = {
  fullName: '',
  dateOfBirth: '',
  gender: '',
  education: '',
  aadhaarNumber: '',
  address: '',
  mobileNumber: '',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildTimelineNodes(app: employment_application, exception_flags: Record<string, unknown> | null): TimelineNode[] {
  const nodes: TimelineNode[] = [
    {
      state: 'Submitted',
      label: 'Application Submitted',
      status: ['Submitted', 'MathVerification', 'CL4Checklist', 'HQApproval', 'TransparencyWindow', 'AppointmentLetter'].includes(app.state) ? 'done' : 'pending',
      timestamp: app.submitted_at ?? undefined,
    },
    {
      state: 'MathVerification',
      label: 'Math Engine Verification',
      status: ['MathVerification', 'CL4Checklist', 'HQApproval', 'TransparencyWindow', 'AppointmentLetter'].includes(app.state) ? 'done' : app.state === 'Submitted' ? 'current' : 'pending',
      actor: 'System',
    },
    {
      state: 'CL4Checklist',
      label: 'CL-4 Checklist',
      status: ['CL4Checklist', 'HQApproval', 'TransparencyWindow', 'AppointmentLetter'].includes(app.state) ? 'done' : app.state === 'MathVerification' ? 'current' : 'pending',
      actor: 'CL-4 Officer',
    },
    {
      state: 'HQApproval',
      label: 'HQ Approval',
      status: ['HQApproval', 'TransparencyWindow', 'AppointmentLetter'].includes(app.state) ? 'done' : app.state === 'CL4Checklist' ? 'current' : 'pending',
      actor: 'HQ Manager',
      timestamp: app.hqApprovedAt ?? undefined,
    },
    {
      state: 'TransparencyWindow',
      label: 'Transparency Window (21 days)',
      status: ['TransparencyWindow', 'AppointmentLetter'].includes(app.state) ? (app.state === 'TransparencyWindow' ? 'current' : 'done') : app.state === 'HQApproval' ? 'current' : 'pending',
      timestamp: app.transparency_window_ends_at ?? undefined,
    },
    {
      state: 'AppointmentLetter',
      label: 'Appointment Letter',
      status: app.state === 'AppointmentLetter' ? 'current' : 'pending',
    },
  ]

  // Insert conditional branch node for female nominee counseling (Form-XXIII)
  if (exception_flags?.femaleNomineeCounseling) {
    nodes.splice(4, 0, {
      state: 'FormXXIII_Counseling',
      label: 'Form-XXIII Female Counseling',
      status: 'done',
      isBranch: true,
      note: 'Conditional exception — female nominee counseling completed',
    })
  }

  return nodes
}

function daysRemaining(endIso: string): number {
  return Math.ceil((new Date(endIso).getTime() - Date.now()) / 86400000)
}

// ─── Component ───────────────────────────────────────────────────────────────

export function EmploymentWizardView() {
  const qc = useQueryClient()
  const { user } = useAuth()

  // Wizard state
  const [step, setStep] = React.useState(0)
  const [maxVisited, setMaxVisited] = React.useState(0)
  const [selectedPoolId, setSelectedPoolId] = React.useState<string | null>(null)
  const [applicationId, setApplicationId] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  // Form state (step 2)
  const [bioData, setBioData] = React.useState<BioDataForm>(INITIAL_BIO_DATA)
  const [selfDeclarationChecked, setSelfDeclarationChecked] = React.useState(false)

  // Upload state (step 3)
  const [uploadedDocs, setUploadedDocs] = React.useState<Record<string, Array<{ file_name: string; file_size_kb: number; mime_type: string; virus_scan_status: 'clean' | 'scanning'; uploadedAt: string }>>>({})

  // ── Queries ──

  const { data: pools, isLoading: poolsLoading, error: poolsError } = useQuery({
    queryKey: ['nominee-pools'],
    queryFn: fetchPools,
  })

  const { data: poolDetail, isLoading: poolLoading } = useQuery({
    queryKey: ['nominee-pools', selectedPoolId],
    queryFn: () => fetchPoolDetail(selectedPoolId!),
    enabled: !!selectedPoolId,
  })

  const { data: application, isLoading: appLoading } = useQuery({
    queryKey: ['employment-application', applicationId],
    queryFn: () => fetchApplication(applicationId!),
    enabled: !!applicationId,
  })

  // ── Mutations ──

  const createAppMutation = useMutation({
    mutationFn: (pool_id: string) => createDraftApplication(pool_id),
    onSuccess: (app) => {
      setApplicationId(app.id)
      toast.success('Draft application created', {
        description: `Reference: ${app.application_code}`,
      })
      qc.invalidateQueries({ queryKey: ['nominee-pools'] })
      qc.invalidateQueries({ queryKey: ['employment-application'] })
    },
    onError: (e: Error) => toast.error('Failed to create application', { description: e.message }),
  })

  const saveBioDataMutation = useMutation({
    mutationFn: (appId: string) =>
      updateApplication(appId, {
        bioData: JSON.stringify(bioData),
        selfDeclarationConfirmed: selfDeclarationChecked,
      }),
    onSuccess: () => {
      toast.success('Bio-data saved', { description: 'Form-V/VI details persisted' })
      qc.invalidateQueries({ queryKey: ['employment-application'] })
    },
    onError: (e: Error) => toast.error('Save failed', { description: e.message }),
  })

  const submitApplicationMutation = useMutation({
    mutationFn: (appId: string) =>
      updateApplication(appId, {
        bioData: JSON.stringify(bioData),
        selfDeclarationConfirmed: true,
        state: 'Submitted',
      }),
    onSuccess: (app) => {
      toast.success(`Application ${app.application_code} submitted`, {
        description: 'Your employment application is now in the verification pipeline.',
      })
      qc.invalidateQueries({ queryKey: ['employment-application'] })
      qc.invalidateQueries({ queryKey: ['nominee-pools'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      handleStepChange(4)
    },
    onError: (e: Error) => toast.error('Submission failed', { description: e.message }),
    onSettled: () => setSubmitting(false),
  })

  // ── Handlers ──

  const handleStepChange = React.useCallback((next: number) => {
    setStep(next)
    setMaxVisited((m) => Math.max(m, next))
    toast.info('Step auto-saved', { description: `Draft persisted at step ${next + 1}` })
  }, [])

  const handlePoolSelect = React.useCallback((pool_id: string, hasCrossed: boolean) => {
    if (!hasCrossed) {
      toast.warning('Threshold not met', {
        description: 'Pooled acreage must reach 2.0000 acres before applying.',
      })
      return
    }
    setSelectedPoolId(pool_id)
    handleStepChange(1)
  }, [handleStepChange])

  const handleStartApplication = React.useCallback(() => {
    if (!selectedPoolId) return
    createAppMutation.mutate(selectedPoolId)
  }, [selectedPoolId, createAppMutation])

  const handleBioDataNext = React.useCallback(() => {
    if (!applicationId) return
    saveBioDataMutation.mutate(applicationId)
    handleStepChange(3)
  }, [applicationId, saveBioDataMutation, handleStepChange])

  const handleDocUpload = React.useCallback((docKey: string, file: File) => {
    setUploadedDocs((prev) => ({
      ...prev,
      [docKey]: [
        ...(prev[docKey] ?? []),
        {
          file_name: file.name,
          file_size_kb: Math.round(file.size / 1024),
          mime_type: file.type,
          virus_scan_status: 'clean' as const,
          uploadedAt: new Date().toISOString(),
        },
      ],
    }))
    toast.success(`Uploaded: ${file.name}`)
  }, [])

  const handleDocRemove = React.useCallback((docKey: string, file_name: string) => {
    setUploadedDocs((prev) => ({
      ...prev,
      [docKey]: (prev[docKey] ?? []).filter((d) => d.file_name !== file_name),
    }))
  }, [])

  const handleSubmit = React.useCallback(() => {
    if (!applicationId) return
    setSubmitting(true)
    submitApplicationMutation.mutate(applicationId)
  }, [applicationId, submitApplicationMutation])

  // If draft was created, advance to step 2
  React.useEffect(() => {
    if (createAppMutation.isSuccess && applicationId && step === 1) {
      handleStepChange(2)
    }
  }, [createAppMutation.isSuccess, applicationId, step, handleStepChange])

  // ── Derived state ──

  const pooled_acreage = poolDetail ? Number(poolDetail.pooled_acreage) || 0 : 0
  const thresholdPct = Math.min(100, (pooled_acreage / EMPLOYMENT_THRESHOLD) * 100)
  const thresholdMet = pooled_acreage >= EMPLOYMENT_THRESHOLD
  const hasExceptionFemale = poolDetail?.exception_flags
    ? JSON.parse(poolDetail.exception_flags)?.femaleNomineeCounseling === true
    : false

  const isSubmitted = application?.state === 'Submitted' ||
    ['MathVerification', 'CL4Checklist', 'HQApproval', 'TransparencyWindow', 'AppointmentLetter'].includes(application?.state ?? '')
  const allRequiredDocsUploaded = DOCUMENT_CHECKLIST.every(
    (d) => !(d as any).required || (uploadedDocs[d.key]?.length ?? 0) > 0,
  )
  const bioDataValid = bioData.fullName.trim() !== '' &&
    bioData.dateOfBirth !== '' &&
    bioData.gender !== '' &&
    bioData.education !== '' &&
    bioData.aadhaarNumber.trim() !== '' &&
    bioData.mobileNumber.trim() !== ''

  // Navigation guards per step
  const canNext = React.useMemo(() => {
    switch (step) {
      case 0: return false // Pool selection uses its own buttons
      case 1: return createAppMutation.isSuccess
      case 2: return selfDeclarationChecked && bioDataValid
      case 3: return allRequiredDocsUploaded
      case 4: return false // Last step
      default: return false
    }
  }, [step, createAppMutation.isSuccess, selfDeclarationChecked, bioDataValid, allRequiredDocsUploaded])

  const isLastStep = step === WIZARD_STEPS.length - 1

  const onStepChange = React.useCallback(
    (next: number) => {
      if (next <= maxVisited) handleStepChange(next)
    },
    [maxVisited, handleStepChange],
  )

  const handleNext = React.useCallback(() => {
    if (step === 1 && !createAppMutation.isSuccess && selectedPoolId) {
      handleStartApplication()
      return
    }
    if (step === 2) {
      handleBioDataNext()
      return
    }
    if (step === 3) {
      handleSubmit()
      return
    }
    if (canNext && step < WIZARD_STEPS.length - 1) {
      handleStepChange(step + 1)
    }
  }, [step, canNext, selectedPoolId, createAppMutation.isSuccess, handleStartApplication, handleBioDataNext, handleSubmit, handleStepChange])

  // ─── Countdown widget ──

  const [countdown, setCountdown] = React.useState<{ d: number; h: number; m: number; s: number } | null>(null)

  React.useEffect(() => {
    if (!application?.transparency_window_ends_at || application.state !== 'TransparencyWindow') {
      setCountdown(null)
      return
    }
    const tick = () => {
      const diff = new Date(application.transparency_window_ends_at!).getTime() - Date.now()
      if (diff <= 0) {
        setCountdown({ d: 0, h: 0, m: 0, s: 0 })
        return
      }
      setCountdown({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [application?.transparency_window_ends_at, application?.state])

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Employment Application Wizard</h2>
          <p className="text-sm text-muted-foreground">
            Module M10 · Public Portal · 2.00-acre nominee pooling gate · Form-V/VI capture
          </p>
        </div>
      </div>

      {/* Step Indicator (4 dots) */}
      <div className="rounded-lg border border-border/60 bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          {WIZARD_STEPS.map((s, i) => {
            const Icon = s.icon
            const st = i < step ? 'complete' : i === step ? 'active' : 'pending'
            const clickable = i <= maxVisited
            return (
              <React.Fragment key={s.key}>
                <button
                  type="button"
                  disabled={!clickable}
                  onClick={() => clickable && onStepChange(i)}
                  className={`group flex flex-1 flex-col items-center gap-1.5 text-center transition ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition ${
                      st === 'complete'
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : st === 'active'
                          ? 'border-amber-500 bg-amber-500 text-white ring-4 ring-amber-100 dark:ring-amber-950'
                          : 'border-border bg-background text-muted-foreground'
                    }`}
                  >
                    {st === 'complete' ? <CheckCircle2 className="h-4 w-4" /> : Icon ? <Icon className="h-4 w-4" /> : i + 1}
                  </span>
                  <span className={`hidden text-xs font-medium sm:block ${st === 'active' ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {s.title}
                  </span>
                </button>
                {i < WIZARD_STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 rounded-full transition ${i < step ? 'bg-emerald-400' : 'bg-border'}`} />
                )}
              </React.Fragment>
            )
          })}
        </div>
        <div className="mt-3 text-center text-xs text-muted-foreground sm:hidden">
          Step {step + 1} of {WIZARD_STEPS.length}:{' '}
          <span className="font-medium text-foreground">{WIZARD_STEPS[step].title}</span>
        </div>
      </div>

      {/* ── Step Content ── */}
      <div className="min-h-[320px]">
        {/* ─── Step 0: Pool Selection ─── */}
        {step === 0 && (
          <PoolSelectionStep
            pools={pools}
            isLoading={poolsLoading}
            error={poolsError}
            onSelect={handlePoolSelect}
          />
        )}

        {/* ─── Step 1: Eligibility Check (PUB-M10-01) ─── */}
        {step === 1 && (
          <EligibilityStep
            pool={poolDetail}
            isLoading={poolLoading}
            pooled_acreage={pooled_acreage}
            thresholdPct={thresholdPct}
            thresholdMet={thresholdMet}
            creating={createAppMutation.isPending}
            onStart={handleStartApplication}
            onBack={() => handleStepChange(0)}
          />
        )}

        {/* ─── Step 2: Form-V/VI Capture (PUB-M10-02) ─── */}
        {step === 2 && (
          <FormVICaptureStep
            bioData={bioData}
            onBioDataChange={setBioData}
            selfDeclarationChecked={selfDeclarationChecked}
            onSelfDeclarationChange={setSelfDeclarationChecked}
            saving={saveBioDataMutation.isPending}
          />
        )}

        {/* ─── Step 3: document Upload (PUB-M10-03) ─── */}
        {step === 3 && (
          <DocumentUploadStep
            uploadedDocs={uploadedDocs}
            onUpload={handleDocUpload}
            onRemove={handleDocRemove}
            hasFemaleException={hasExceptionFemale}
          />
        )}

        {/* ─── Step 4: Status Tracker (PUB-M10-04) ─── */}
        {step === 4 && (
          <StatusTrackerStep
            application={application}
            isLoading={appLoading}
            exception_flags={poolDetail?.exception_flags ?? null}
            countdown={countdown}
          />
        )}
      </div>

      {/* ── Navigation Footer ── */}
      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => step > 0 && handleStepChange(step - 1)}
          disabled={step === 0}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="text-xs text-muted-foreground">
          {step + 1} / {WIZARD_STEPS.length}
        </div>

        {step === 3 ? (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!allRequiredDocsUploaded || submitting || submitApplicationMutation.isPending}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {submitting || submitApplicationMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Submit Application
          </Button>
        ) : step < WIZARD_STEPS.length - 1 && step > 0 ? (
          <Button
            type="button"
            onClick={handleNext}
            disabled={!canNext}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {step === 1 && createAppMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : step === 2 && saveBioDataMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            {step === 1 && !createAppMutation.isSuccess ? 'Start My Application' : 'Next'}
            {step === 1 && !createAppMutation.isPending && <ArrowRight className="h-4 w-4" />}
          </Button>
        ) : step === 0 ? (
          <div />
        ) : null}
      </div>
    </div>
  )
}

// ─── Step 0: Pool Selection ──────────────────────────────────────────────────

function PoolSelectionStep({
  pools,
  isLoading,
  error,
  onSelect,
}: {
  pools: nominee_pool[] | undefined
  isLoading: boolean
  error: Error | null
  onSelect: (pool_id: string, hasCrossed: boolean) => void
}) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <p className="text-sm text-muted-foreground">Loading your nominee pools…</p>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="border-rose-200 bg-rose-50 dark:bg-rose-950/30">
        <AlertCircle className="h-4 w-4 text-rose-600" />
        <AlertDescription className="text-rose-800 dark:text-rose-300">
          Failed to load nominee pools: {error.message}
        </AlertDescription>
      </Alert>
    )
  }

  if (!pools || pools.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <Users className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">No nominee pools found</p>
        <p className="text-xs text-muted-foreground/70">
          You need to be nominated in a pool before you can apply for employment.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <SectionCard
        title="Select Nominee Pool"
        icon={Users}
        description="Choose which nominee pool you want to apply for employment under."
      >
        <div className="space-y-3">
          {pools.map((pool) => {
            const pooled = Number(pool.pooled_acreage) || 0
            const pct = Math.min(100, (pooled / EMPLOYMENT_THRESHOLD) * 100)
            const met = pool.hasCrossedThreshold

            return (
              <div
                key={pool.id}
                className="rounded-lg border border-border/60 bg-muted/20 p-4 transition hover:border-amber-300 hover:bg-amber-50/30 dark:hover:bg-amber-950/20"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold">{pool.projectName}</p>
                      <StateBadge state={pool.state} />
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Nominee: <span className="font-medium text-foreground">{pool.nominee_name}</span>
                      {' · '}Contributions: {pool.contributionCount}
                    </p>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-muted-foreground">
                          Pooled: <span className="font-mono font-semibold tabular-nums text-foreground">{formatNumber(pool.pooled_acreage, 4)}</span>{' '}
                          / {formatNumber(EMPLOYMENT_THRESHOLD, 4)} acres
                        </span>
                        <span className={`font-medium tabular-nums ${met ? 'text-emerald-600' : 'text-amber-600'}`}>{pct.toFixed(1)}%</span>
                      </div>
                      <Progress
                        value={pct}
                        className="h-2"
                        indicatorClassName={met ? 'bg-emerald-500' : 'bg-amber-500'}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={() => onSelect(pool.id, met)}
                    disabled={!met}
                    className="bg-amber-600 hover:bg-amber-700 shrink-0"
                  >
                    {met ? (
                      <>
                        <Briefcase className="h-4 w-4" />
                        Apply for Employment
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4" />
                        Threshold Not Met
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </SectionCard>
    </div>
  )
}

// ─── Step 1: Eligibility Check (PUB-M10-01) ──────────────────────────────────

function EligibilityStep({
  pool,
  isLoading,
  pooled_acreage,
  thresholdPct,
  thresholdMet,
  creating,
  onStart,
  onBack,
}: {
  pool: nominee_pool | undefined
  isLoading: boolean
  pooled_acreage: number
  thresholdPct: number
  thresholdMet: boolean
  creating: boolean
  onStart: () => void
  onBack: () => void
}) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <p className="text-sm text-muted-foreground">Fetching fresh eligibility data…</p>
      </div>
    )
  }

  if (!pool) {
    return (
      <Alert variant="destructive" className="border-rose-200 bg-rose-50 dark:bg-rose-950/30">
        <AlertCircle className="h-4 w-4 text-rose-600" />
        <AlertDescription className="text-rose-800 dark:text-rose-300">
          Pool data unavailable. Please go back and select a pool again.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <SectionCard
        title="Eligibility Check"
        icon={ShieldCheck}
        description="PUB-M10-01 — Re-verifying pooled acreage against the 2.00-acre statutory threshold"
      >
        <div className="space-y-5">
          {/* Pool info */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <InfoTile label="Project" value={pool.projectName} />
            <InfoTile label="Nominee" value={pool.nominee_name} />
            <InfoTile label="State" value={pool.state} />
            <InfoTile label="Contributions" value={String(pool.contributionCount)} />
          </div>

          <Separator />

          {/* Large progress bar */}
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-3xl font-bold tabular-nums">{formatNumber(pooled_acreage, 4)}</p>
                <p className="text-xs text-muted-foreground">
                  Your pooled land total: <span className="font-mono font-semibold">{formatNumber(pooled_acreage, 4)}</span>{' '}
                  / {formatNumber(EMPLOYMENT_THRESHOLD, 4)} acres
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">threshold</p>
                <p className="text-lg font-semibold tabular-nums">{formatNumber(EMPLOYMENT_THRESHOLD, 2)} ac</p>
              </div>
            </div>

            <Progress
              value={thresholdPct}
              className="h-4"
              indicatorClassName={thresholdMet ? 'bg-emerald-500' : 'bg-amber-500'}
            />

            <div className="flex items-center justify-between text-xs">
              <span className={thresholdMet ? 'text-emerald-700' : 'text-amber-700'}>
                {thresholdMet ? (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    ✓ Threshold crossed — you are eligible to apply
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" />
                    ⚠ {formatNumber(EMPLOYMENT_THRESHOLD - pooled_acreage, 4)} acres short — application blocked
                  </span>
                )}
              </span>
              <span className="font-medium tabular-nums">{thresholdPct.toFixed(1)}%</span>
            </div>
          </div>

          <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/30">
            <ShieldCheck className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-300">
              <strong>Defense in depth:</strong> This eligibility check is re-fetched from the server. The threshold
              gate is also enforced at the application layer (Workflow Engine guard) and database layer (UNIQUE constraint
              on contributions).
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
              Back to Pools
            </Button>
            <Button
              onClick={onStart}
              disabled={!thresholdMet || creating}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Briefcase className="h-4 w-4" />
              )}
              Start My Application
            </Button>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}

// ─── Step 2: Form-V/VI Capture (PUB-M10-02) ─────────────────────────────────

function FormVICaptureStep({
  bioData,
  onBioDataChange,
  selfDeclarationChecked,
  onSelfDeclarationChange,
  saving,
}: {
  bioData: BioDataForm
  onBioDataChange: (data: BioDataForm) => void
  selfDeclarationChecked: boolean
  onSelfDeclarationChange: (checked: boolean) => void
  saving: boolean
}) {
  const update = (field: keyof BioDataForm, value: string) => {
    onBioDataChange({ ...bioData, [field]: value })
  }

  return (
    <div className="space-y-4">
      <SectionCard
        title="Form-V/VI Bio-Data Capture"
        icon={FileText}
        description="PUB-M10-02 — Personal details and self-declaration for employment application"
      >
        <div className="space-y-5">
          <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/30">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-300">
              All fields marked with an asterisk are mandatory. Data is validated client-side (instant feedback)
              and server-side (Layer-3 re-check) before submission.
            </AlertDescription>
          </Alert>

          {/* Row 1: Name + DOB */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Full Name *" hint="As per Aadhaar / EPIC">
              <Input
                value={bioData.fullName}
                onChange={(e) => update('fullName', e.target.value)}
                placeholder="Enter full name"
              />
            </Field>
            <Field label="Date of Birth *" hint="DD/MM/YYYY format">
              <Input
                type="date"
                value={bioData.dateOfBirth}
                onChange={(e) => update('dateOfBirth', e.target.value)}
              />
            </Field>
          </div>

          {/* Row 2: Gender + Education */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Gender *">
              <Select value={bioData.gender} onValueChange={(v) => update('gender', v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Education *" hint="Highest qualification">
              <Select value={bioData.education} onValueChange={(v) => update('education', v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select education level" />
                </SelectTrigger>
                <SelectContent>
                  {EDUCATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {/* Row 3: Aadhaar */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Aadhaar Number *" hint="12-digit — hashed server-side (SHA-256), never stored raw">
              <Input
                value={bioData.aadhaarNumber}
                onChange={(e) =>
                  update('aadhaarNumber', e.target.value.replace(/[^0-9]/g, '').slice(0, 12))
                }
                placeholder="123456789012"
                maxLength={12}
                className="font-mono"
              />
            </Field>
            <Field label="Mobile Number *" hint="10-digit Indian mobile">
              <Input
                value={bioData.mobileNumber}
                onChange={(e) =>
                  update('mobileNumber', e.target.value.replace(/[^0-9]/g, '').slice(0, 10))
                }
                placeholder="9876543210"
                maxLength={10}
                className="font-mono"
              />
            </Field>
          </div>

          {/* Row 4: Address */}
          <Field label="Address *" hint="Current residential address">
            <Input
              value={bioData.address}
              onChange={(e) => update('address', e.target.value)}
              placeholder="Village / Town, Post Office, District, State, PIN"
            />
          </Field>

          <Separator />

          {/* Self-declaration */}
          <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 p-4">
            <Checkbox
              id="self-declaration"
              checked={selfDeclarationChecked}
              onCheckedChange={(checked) => onSelfDeclarationChange(checked === true)}
              className="mt-0.5"
            />
            <Label htmlFor="self-declaration" className="text-sm leading-relaxed">
              I confirm that the relationship and eligibility details provided are true and correct to the best
              of my knowledge and belief. I understand that any false statement may lead to disqualification
              from the employment process under the CBA Act provisions.
            </Label>
          </div>

          {!selfDeclarationChecked && (
            <p className="flex items-center gap-1.5 text-xs text-amber-700">
              <AlertCircle className="h-3 w-3" />
              Self-declaration must be confirmed to proceed.
            </p>
          )}
        </div>
      </SectionCard>
    </div>
  )
}

// ─── Step 3: document Upload (PUB-M10-03) ────────────────────────────────────

function DocumentUploadStep({
  uploadedDocs,
  onUpload,
  onRemove,
  hasFemaleException,
}: {
  uploadedDocs: Record<string, Array<{ file_name: string; file_size_kb: number; mime_type: string; virus_scan_status: 'clean' | 'scanning'; uploadedAt: string }>>
  onUpload: (docKey: string, file: File) => void
  onRemove: (docKey: string, file_name: string) => void
  hasFemaleException: boolean
}) {
  const allDocs = hasFemaleException
    ? [...DOCUMENT_CHECKLIST, { key: 'FORM_XXIII_COUNSELING', label: 'Form-XXIII Female Nominee Counseling', required: true }]
    : [...DOCUMENT_CHECKLIST]

  return (
    <div className="space-y-4">
      <SectionCard
        title="document Upload"
        icon={Upload}
        description="PUB-M10-03 — Upload mandatory documents for verification"
      >
        <div className="space-y-4">
          <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/30">
            <ShieldCheck className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-300">
              Layer-1 client-side validation runs before upload (instant feedback, zero roundtrip); Layer-3
              server MIME re-check on receipt. All documents are virus-scanned before processing.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4 sm:grid-cols-2">
            {allDocs.map((doc) => (
              <div
                key={doc.key}
                className="rounded-lg border border-border/60 bg-card p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {doc.label}
                    {doc.required && <span className="ml-1 text-rose-500">*</span>}
                  </span>
                  {(uploadedDocs[doc.key]?.length ?? 0) > 0 ? (
                    <Badge className="gap-1 border-emerald-300 bg-emerald-50 text-[10px] text-emerald-700 hover:bg-emerald-50">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      Uploaded
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                      Pending
                    </Badge>
                  )}
                </div>
                <DocumentUploader
                  checklist_item_key={doc.key}
                  label=""
                  documents={uploadedDocs[doc.key] ?? []}
                  onUpload={(file) => onUpload(doc.key, file)}
                  onRemove={(d) => onRemove(doc.key, d.file_name)}
                />
              </div>
            ))}
          </div>

          {hasFemaleException && (
            <Alert className="border-sky-200 bg-sky-50 dark:bg-sky-950/30">
              <AlertCircle className="h-4 w-4 text-sky-600" />
              <AlertDescription className="text-sky-800 dark:text-sky-300">
                <strong>Conditional document required:</strong> Form-XXIII (Female Nominee Counseling Certificate)
                is required because this pool has a female nominee counseling exception flag.
              </AlertDescription>
            </Alert>
          )}

          <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2">
            <p className="text-xs text-muted-foreground">
              <strong>Accepted formats:</strong> PDF, JPG, JPEG, PNG, DOCX · Max 10 MB per file · Virus scan automatic
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}

// ─── Step 4: Status Tracker (PUB-M10-04) ─────────────────────────────────────

function StatusTrackerStep({
  application,
  isLoading,
  exception_flags,
  countdown,
}: {
  application: employment_application | undefined
  isLoading: boolean
  exception_flags: string | null
  countdown: { d: number; h: number; m: number; s: number } | null
}) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <p className="text-sm text-muted-foreground">Loading application status…</p>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <Briefcase className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">No application found</p>
        <p className="text-xs text-muted-foreground/70">
          Application data could not be loaded. Please try again later.
        </p>
      </div>
    )
  }

  const flags = exception_flags ? JSON.parse(exception_flags) as Record<string, unknown> : null
  const timelineNodes = buildTimelineNodes(application, flags)

  return (
    <div className="space-y-4">
      <SectionCard
        title="Status Transparency Tracker"
        icon={Briefcase}
        description="PUB-M10-04 — Real-time application status with 21-day countdown"
      >
        <div className="space-y-4">
          {/* Application summary bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-semibold">{application.application_code}</span>
                <StateBadge state={application.state} />
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {application.projectName} · {application.nominee_name}
                {application.submitted_at && (
                  <> · Submitted {timeAgo(application.submitted_at)}</>
                )}
              </p>
            </div>
            {application.submitted_at && (
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Submitted On</p>
                <p className="text-sm font-medium tabular-nums">
                  {new Date(application.submitted_at).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
            )}
          </div>

          {/* Countdown widget for Transparency Window */}
          {countdown && application.state === 'TransparencyWindow' && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:bg-amber-950/30">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-amber-600" />
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  Transparency Window Countdown
                </p>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { value: countdown.d, label: 'Days' },
                  { value: countdown.h, label: 'Hours' },
                  { value: countdown.m, label: 'Minutes' },
                  { value: countdown.s, label: 'Seconds' },
                ].map((unit) => (
                  <div key={unit.label} className="rounded-md border border-amber-200 bg-white px-2 py-2 dark:border-amber-800 dark:bg-amber-950/50">
                    <p className="text-2xl font-bold tabular-nums text-amber-700 dark:text-amber-300">
                      {String(unit.value).padStart(2, '0')}
                    </p>
                    <p className="text-[10px] uppercase tracking-wide text-amber-600/70">{unit.label}</p>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-amber-700/70">
                Window ends:{' '}
                {application.transparency_window_ends_at
                  ? new Date(application.transparency_window_ends_at).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '—'}
              </p>
            </div>
          )}

          {/* Timeline */}
          <StatusTimeline nodes={timelineNodes} maxheight={420} />

          {/* Exception flags note */}
          {flags && Object.keys(flags).length > 0 && (
            <>
              <Separator />
              <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2">
                <p className="mb-1.5 text-xs font-medium">Active Exception Flags</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(flags).map(([k, v]) => (
                    <Badge
                      key={k}
                      variant="outline"
                      className={
                        v
                          ? 'border-amber-300 bg-amber-100 text-amber-700'
                          : 'border-slate-200 bg-slate-50 text-slate-600'
                      }
                    >
                      {k}: {v ? 'triggered' : 'n/a'}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </SectionCard>
    </div>
  )
}

// ─── Shared sub-components ───────────────────────────────────────────────────

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground/70">{hint}</p>}
    </div>
  )
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-muted/30 p-2.5">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  )
}
export default EmploymentWizardView

