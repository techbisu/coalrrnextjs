'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { routes } from '@/lib/url/UrlService'
import { SectionCard, StateBadge, DataTable } from '@/components/coalrr'
import { formatNumber } from '@/lib/utils/formatters'
import { useAuth } from '@/authorization/providers/AuthProvider'
import { useUiState } from '@/providers/UiStateProvider'
import type { Column } from '@/components/coalrr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import {
  UserPlus,
  Users,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Plus,
  TrendingUp,
  MapPin,
  Clock,
  ChevronRight,
  FileText,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Claim {
  id: string
  claim_code: string
  plot_number: string
  own_share_acres: string
  state: string
  mouza: string | null
  nominated: boolean
}

interface NomineePoolSummary {
  id: string
  nominee_name: string
  nominee_aadhaar_hash: string
  pooled_acreage: string
  contributionCount: number
  status: 'Pooling' | 'Threshold Met' | 'Application Submitted'
  threshold: string
  hasCrossedThreshold: boolean
  entry_ts: string
}

interface PoolContribution {
  id: string
  claimant_name: string
  plot_number: string
  share_acres: string
  claim_code: string
}

interface NomineePoolDetail {
  id: string
  nominee_name: string
  nominee_aadhaar_hash: string
  pooled_acreage: string
  threshold: string
  hasCrossedThreshold: boolean
  contributionCount: number
  status: 'Pooling' | 'Threshold Met' | 'Application Submitted'
  contributions: PoolContribution[]
  entry_ts: string
}

// ─── API helpers ────────────────────────────────────────────────────────────

async function fetchClaims(): Promise<Claim[]> {
  const r = await fetch('/api/claims')
  if (!r.ok) throw new Error('Failed to load land claims')
  return r.json()
}

async function fetchPools(): Promise<NomineePoolSummary[]> {
  const r = await fetch('/api/nominee-pools')
  if (!r.ok) throw new Error('Failed to load nominee pools')
  return r.json()
}

async function fetchPoolDetail(id: string): Promise<NomineePoolDetail> {
  const r = await fetch(`/api/nominee-pools/${id}`)
  if (!r.ok) throw new Error('Failed to load pool detail')
  return r.json()
}

// ─── Constants ──────────────────────────────────────────────────────────────

const THRESHOLD_ACRES = 2.0

const RELATIONSHIP_OPTIONS = [
  { value: 'Spouse', label: 'Spouse' },
  { value: 'Son', label: 'Son' },
  { value: 'Daughter', label: 'Daughter' },
  { value: 'Father', label: 'Father' },
  { value: 'Mother', label: 'Mother' },
  { value: 'Brother', label: 'Brother' },
  { value: 'Sister', label: 'Sister' },
  { value: 'Other', label: 'Other' },
] as const

const POOL_STATUS_META: Record<string, { label: string; color: string }> = {
  Pooling: {
    label: 'Pooling',
    color: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300',
  },
  'Threshold Met': {
    label: 'Threshold Met',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300',
  },
  'Application Submitted': {
    label: 'Application Submitted',
    color: 'bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-950 dark:text-teal-300',
  },
}

// ─── Skeleton helper ────────────────────────────────────────────────────────

function SectionSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3">
      <div className="h-6 w-48 animate-pulse rounded bg-muted" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-10 animate-pulse rounded bg-muted" />
      ))}
    </div>
  )
}

// ─── Pooling Gauge (hero element) ───────────────────────────────────────────

function PoolingGauge({
  pooled,
  threshold,
  label,
}: {
  pooled: number
  threshold: number
  label: string
}) {
  const pct = Math.min(100, (pooled / threshold) * 100)
  const met = pooled >= threshold
  const remaining = Math.max(0, threshold - pooled)

  return (
    <div className="rounded-xl border border-border/60 bg-card p-6">
      <div className="mb-2 flex items-center gap-2">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            met
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
              : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
          }`}
        >
          <TrendingUp className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">2.00-acre employment eligibility threshold</p>
        </div>
      </div>

      <div className="mt-5 flex items-baseline justify-between">
        <div>
          <p className="text-4xl font-bold tabular-nums tracking-tight">
            {formatNumber(pooled, 4)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">acres pooled</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">threshold</p>
          <p className="text-2xl font-semibold tabular-nums">{formatNumber(threshold, 2)} ac</p>
        </div>
      </div>

      {/* Custom progress bar for full color control */}
      <div className="mt-4 h-4 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            met ? 'bg-emerald-500' : 'bg-amber-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5">
          {met ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span className="font-medium text-emerald-700">
                Threshold met — eligible for employment
              </span>
            </>
          ) : (
            <>
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              <span className="font-medium text-amber-700">
                {formatNumber(remaining, 4)} acres remaining to qualify
              </span>
            </>
          )}
        </span>
        <span className="font-mono font-medium tabular-nums text-muted-foreground">
          {pct.toFixed(1)}%
        </span>
      </div>
    </div>
  )
}

// ─── Public List View ───────────────────────────────────────────────────────

function PublicListView() {
  const { user } = useAuth();
  const {  setNominationView, setSelectedClaimForNomination, setSelectedPoolId,   } = useUiState()

  const claimsQuery = useQuery({
    queryKey: ['claims', 'nominatable'],
    queryFn: fetchClaims,
  })

  const poolsQuery = useQuery({
    queryKey: ['nominee-pools', 'mine'],
    queryFn: fetchPools,
  })

  const claims = claimsQuery.data ?? []
  const pools = poolsQuery.data ?? []
  const isLoading = claimsQuery.isLoading || poolsQuery.isLoading

  const handleNominate = (claim: Claim) => {
    setSelectedClaimForNomination(claim.id)
    setNominationView('form')
    window.history.pushState(null, '', routes.nomination.details(claim.id))
  }

  const handleTrack = (pool_id: string) => {
    setSelectedPoolId(pool_id)
    setNominationView('tracking')
    window.history.pushState(null, '', routes.nomination.details(pool_id))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Nominee Package Deal</h2>
        <p className="text-sm text-muted-foreground">
          Module M9 · Form-A Nomination · Pool land shares toward 2.00-acre employment eligibility
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <SectionSkeleton lines={4} />
          <SectionSkeleton lines={2} />
        </div>
      ) : (
        <>
          {/* My Land Claims */}
          <SectionCard
            title="My Land Claims"
            icon={FileText}
            description="Your Form-I claims eligible for nomination. Each share can be contributed to one nominee pool."
          >
            {claims.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                <FileText className="h-8 w-8 opacity-40" />
                <p className="text-sm">No land claims found. Submit a Form-I claim first.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-border/60">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Claim Code
                      </TableHead>
                      <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Plot Number
                      </TableHead>
                      <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground text-right tabular-nums">
                        Share Acres
                      </TableHead>
                      <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Status
                      </TableHead>
                      <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground text-right">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {claims.map((claim, idx) => (
                      <TableRow
                        key={claim.id}
                        className={idx % 2 === 1 ? 'bg-muted/20' : undefined}
                      >
                        <TableCell className="font-mono text-sm font-medium">
                          {claim.claim_code}
                        </TableCell>
                        <TableCell className="text-sm">{claim.plot_number}</TableCell>
                        <TableCell className="text-right font-mono text-sm tabular-nums">
                          {formatNumber(claim.own_share_acres, 4)}
                        </TableCell>
                        <TableCell>
                          <StateBadge state={claim.state} />
                        </TableCell>
                        <TableCell className="text-right">
                          {claim.nominated ? (
                            <Badge
                              variant="outline"
                              className="border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                            >
                              Nominated
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleNominate(claim)}
                              className="gap-1.5 bg-amber-600 text-white hover:bg-amber-700"
                            >
                              <UserPlus className="h-3.5 w-3.5" />
                              Nominate
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </SectionCard>

          {/* Nominee Pools */}
          <SectionCard
            title="Nominee Pools"
            icon={Users}
            description="Pools you have contributed to. Click a pool to track progress toward the 2.00-acre threshold."
          >
            {pools.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                <Users className="h-8 w-8 opacity-40" />
                <p className="text-sm">No nominee pools yet. Nominate a claim to create one.</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {pools.map((pool) => {
                  const pooled = Number(pool.pooled_acreage) || 0
                  const pct = Math.min(100, (pooled / THRESHOLD_ACRES) * 100)
                  const meta = POOL_STATUS_META[pool.status] ?? POOL_STATUS_META.Pooling

                  return (
                    <button
                      key={pool.id}
                      type="button"
                      onClick={() => handleTrack(pool.id)}
                      className="group flex flex-col gap-3 rounded-lg border border-border/60 bg-card p-4 text-left transition-colors hover:border-amber-300 hover:bg-amber-50/50 dark:hover:border-amber-800 dark:hover:bg-amber-950/30"
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{pool.nominee_name}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {pool.contributionCount} contribution{pool.contributionCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <Badge variant="outline" className={`shrink-0 border font-medium ${meta.color}`}>
                          {meta.label}
                        </Badge>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-baseline justify-between text-xs">
                          <span className="font-mono tabular-nums font-semibold">
                            {formatNumber(pool.pooled_acreage, 4)} ac
                          </span>
                          <span className="text-muted-foreground">of {formatNumber(THRESHOLD_ACRES, 2)} ac</span>
                        </div>
                        <Progress
                          value={pct}
                          className="h-2"
                        />
                      </div>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                        <span>Track pool</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </SectionCard>
        </>
      )}
    </div>
  )
}

// ─── ECL List View (ERP-M9-01) ─────────────────────────────────────────────

function EclListView() {
  const { setNominationView, setSelectedPoolId } = useUiState()
  const [statusFilter, setStatusFilter] = React.useState<string>('all')

  const { data: pools = [], isLoading } = useQuery({
    queryKey: ['nominee-pools', 'ecl', statusFilter],
    queryFn: fetchPools,
  })

  const filteredPools =
    statusFilter === 'all'
      ? pools
      : pools.filter((p) => p.status === statusFilter)

  const columns: Column<NomineePoolSummary>[] = [
    {
      key: 'nominee_name',
      header: 'Nominee Name',
      sortable: true,
      render: (row) => (
        <span className="font-medium">{row.nominee_name}</span>
      ),
    },
    {
      key: 'pooled_acreage',
      header: 'Pooled Acreage',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span className="font-mono tabular-nums">{formatNumber(row.pooled_acreage, 4)} ac</span>
      ),
    },
    {
      key: 'hasCrossedThreshold',
      header: 'Threshold Met',
      align: 'center',
      render: (row) =>
        row.hasCrossedThreshold ? (
          <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-600" />
        ) : (
          <AlertCircle className="mx-auto h-4 w-4 text-amber-500" />
        ),
    },
    {
      key: 'contributionCount',
      header: 'Contributions',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span className="font-mono tabular-nums">{row.contributionCount}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const meta = POOL_STATUS_META[row.status] ?? POOL_STATUS_META.Pooling
        return (
          <Badge variant="outline" className={`border font-medium ${meta.color}`}>
            {meta.label}
          </Badge>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">ERP-M9-01 Nominee Pool Monitor</h2>
          <p className="text-sm text-muted-foreground">
            Module M9 · ECL internal view of all nominee pools and pooling progress
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-[180px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Pooling">Pooling</SelectItem>
              <SelectItem value="Threshold Met">Threshold Met</SelectItem>
              <SelectItem value="Application Submitted">Application Submitted</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <SectionCard
        title="All Nominee Pools"
        icon={Users}
        description="Comprehensive view of all nominee pools across the project area"
      >
        <DataTable<NomineePoolSummary>
          columns={columns}
          data={filteredPools}
          getRowId={(row) => row.id}
          loading={isLoading}
          emptyMessage="No nominee pools match the selected filter."
          onRowClick={(row) => {
            setSelectedPoolId(row.id)
            setNominationView('tracking')
          }}
          searchPlaceholder="Search by nominee name…"
          className="[&_td]:py-2.5"
        />
      </SectionCard>
    </div>
  )
}

// ─── Form View (PUB-M9-01) ──────────────────────────────────────────────────

function NominationFormView() {
  const { user } = useAuth();
  const { 
    nominationView, setNominationView,
    selectedClaimForNomination: selectedClaimId, setSelectedClaimForNomination,
    setSelectedPoolId
   } = useUiState()
  const queryClient = useQueryClient()

  const [nominee_aadhaar_hash, setNomineeAadhaarHash] = React.useState('')
  const [nominee_name, setNomineeName] = React.useState('')
  const [relationship, setRelationship] = React.useState('')
  const [formError, setFormError] = React.useState<string | null>(null)

  const { data: claims = [], isLoading: claimsLoading } = useQuery({
    queryKey: ['claims', 'nominatable'],
    queryFn: fetchClaims,
  })

  const selectedClaim = claims.find((c) => c.id === selectedClaimId) ?? null

  // Reset form when claim changes
  React.useEffect(() => {
    setNomineeAadhaarHash('')
    setNomineeName('')
    setRelationship('')
    setFormError(null)
  }, [selectedClaimId])

  const nominateMutation = useMutation({
    mutationFn: async (payload: {
      nominee_aadhaar_hash: string
      nominee_name: string
      relationship: string
      claimId: string
      share_acres: string
    }) => {
      const r = await fetch('/api/nominate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await r.json()
      if (!r.ok) {
        throw new Error(data.error ?? data.message ?? 'Nomination failed')
      }
      return data
    },
    onSuccess: (data) => {
      toast.success('Nomination submitted successfully', {
        description: `${nominee_name} now has ${selectedClaim?.own_share_acres ?? '0'} acres pooled.`,
      })
      queryClient.invalidateQueries({ queryKey: ['claims'] })
      queryClient.invalidateQueries({ queryKey: ['nominee-pools'] })
      if (data?.pool_id) {
        setSelectedPoolId(data.pool_id)
        setNominationView('tracking')
      } else {
        setSelectedClaimForNomination(null)
        setNominationView('list'); window.history.pushState(null, '', routes.nomination.list());
      }
    },
    onError: (err: Error) => {
      const msg = err.message.toLowerCase()
      if (msg.includes('already nominated') || msg.includes('already been nominated')) {
        setFormError('This land share has already been nominated. Each share can only be contributed to one nominee pool.')
      } else {
        setFormError(err.message)
      }
      toast.error('Nomination failed', {
        description: err.message,
      })
    },
  })

  const isSubmitting = nominateMutation.isPending
  const canSubmit =
    selectedClaim &&
    nominee_aadhaar_hash.trim().length >= 4 &&
    nominee_name.trim().length >= 2 &&
    relationship.length > 0 &&
    !isSubmitting

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClaim || !canSubmit) return

    setFormError(null)
    nominateMutation.mutate({
      nominee_aadhaar_hash: nominee_aadhaar_hash.trim(),
      nominee_name: nominee_name.trim(),
      relationship,
      claimId: selectedClaim.id,
      share_acres: selectedClaim.own_share_acres,
    })
  }

  if (nominationView !== 'form') return null

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-muted-foreground hover:text-foreground"
        onClick={() => {
          setSelectedClaimForNomination(null)
          setNominationView('list'); window.history.pushState(null, '', routes.nomination.list());
        }}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Claims
      </Button>

      <div>
        <h2 className="text-xl font-bold tracking-tight">Form-A Nomination</h2>
        <p className="text-sm text-muted-foreground">
          PUB-M9-01 · Nominate a family member for employment eligibility pooling
        </p>
      </div>

      {claimsLoading ? (
        <SectionSkeleton lines={6} />
      ) : !selectedClaim ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No claim selected. Please go back and select a claim to nominate.
          </AlertDescription>
        </Alert>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Context card: selected claim restatement */}
          <SectionCard
            title="Selected Claim"
            icon={FileText}
            description="Read-only restatement of the land share you are contributing"
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Claim Code</p>
                <p className="mt-0.5 font-mono text-sm font-semibold">{selectedClaim.claim_code}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Plot Number</p>
                <p className="mt-0.5 text-sm font-medium">{selectedClaim.plot_number}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Your Share</p>
                <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums">
                  {formatNumber(selectedClaim.own_share_acres, 4)} acres
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <div className="mt-0.5">
                  <StateBadge state={selectedClaim.state} />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Nominee identity */}
          <SectionCard
            title="Nominee Identity"
            icon={UserPlus}
            description="Provide the nominee's Aadhaar hash and personal details"
          >
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nominee-aadhaar">
                    Nominee Aadhaar Hash <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="nominee-aadhaar"
                    type="text"
                    placeholder="Last 4+ digits of Aadhaar hash"
                    value={nominee_aadhaar_hash}
                    onChange={(e) => setNomineeAadhaarHash(e.target.value)}
                    className="font-mono"
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the hashed Aadhaar identifier linked to the nominee
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nominee-name">
                    Nominee Full Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="nominee-name"
                    type="text"
                    placeholder="As on Aadhaar"
                    value={nominee_name}
                    onChange={(e) => setNomineeName(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="max-w-xs space-y-2">
                <Label htmlFor="relationship">
                  Relationship to Claimant <span className="text-rose-500">*</span>
                </Label>
                <Select value={relationship} onValueChange={setRelationship} disabled={isSubmitting}>
                  <SelectTrigger id="relationship" className="w-full">
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIP_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SectionCard>

          {/* Contribution confirmation */}
          <SectionCard
            title="Contribution Confirmation"
            icon={TrendingUp}
            description="Review before submitting — this action is irreversible"
          >
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div className="space-y-1.5 text-sm">
                  <p className="font-medium text-amber-900 dark:text-amber-200">
                    You are contributing{' '}
                    <span className="font-mono font-bold tabular-nums">
                      {formatNumber(selectedClaim.own_share_acres, 4)} acres
                    </span>{' '}
                    toward{' '}
                    <span className="font-bold">
                      {nominee_name.trim() || '[nominee name]'}
                    </span>
                    {'\u2019'}s employment eligibility
                  </p>
                  <p className="text-amber-700 dark:text-amber-400">
                    Once submitted, this land share cannot be nominated to another person or withdrawn.
                    The share will be pooled with other contributions until the 2.00-acre threshold is met.
                  </p>
                </div>
              </div>
            </div>

            {formError && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
          </SectionCard>

          {/* Submit */}
          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={!canSubmit}
              className="gap-2 bg-amber-600 px-6 text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Submit Nomination
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSelectedClaimForNomination(null)
                setNominationView('list'); window.history.pushState(null, '', routes.nomination.list());
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

// ─── Tracking View (PUB-M9-02) ──────────────────────────────────────────────

function TrackingView() {
  const { nominationView, setNominationView, selectedPoolId, setSelectedPoolId, setView } = useUiState()

  const { data: pool, isLoading, error } = useQuery({
    queryKey: ['nominee-pools', 'detail', selectedPoolId],
    queryFn: () => fetchPoolDetail(selectedPoolId!),
    enabled: !!selectedPoolId && nominationView === 'tracking',
  })

  if (nominationView !== 'tracking') return null

  const pooled = pool ? Number(pool.pooled_acreage) || 0 : 0
  const remaining = Math.max(0, THRESHOLD_ACRES - pooled)
  const thresholdMet = pool?.hasCrossedThreshold ?? false

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-muted-foreground hover:text-foreground"
        onClick={() => {
          setSelectedPoolId(null)
          setNominationView('list'); window.history.pushState(null, '', routes.nomination.list());
        }}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Pools
      </Button>

      <div>
        <h2 className="text-xl font-bold tracking-tight">Nominee Tracking Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          PUB-M9-02 · Pooling gauge and contribution breakdown for this nominee
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-48 animate-pulse rounded-xl bg-muted" />
          <div className="h-32 animate-pulse rounded-lg bg-muted" />
        </div>
      ) : error || !pool ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error
              ? 'Failed to load pool detail. Please try again.'
              : 'No pool selected. Please go back and select a pool to track.'}
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Pooling Gauge — hero element */}
          <PoolingGauge
            pooled={pooled}
            threshold={THRESHOLD_ACRES}
            label={`${pool.nominee_name} — Pool Progress`}
          />

          {/* Pool metadata */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-border/60 bg-card px-4 py-3">
              <p className="text-xs text-muted-foreground">Pool Status</p>
              <div className="mt-1">
                {(() => {
                  const meta = POOL_STATUS_META[pool.status] ?? POOL_STATUS_META.Pooling
                  return (
                    <Badge variant="outline" className={`border font-medium ${meta.color}`}>
                      {meta.label}
                    </Badge>
                  )
                })()}
              </div>
            </div>
            <div className="rounded-lg border border-border/60 bg-card px-4 py-3">
              <p className="text-xs text-muted-foreground">Total Contributions</p>
              <p className="mt-1 font-mono text-lg font-semibold tabular-nums">{pool.contributionCount}</p>
            </div>
            <div className="rounded-lg border border-border/60 bg-card px-4 py-3">
              <p className="text-xs text-muted-foreground">Pooled Acreage</p>
              <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
                {formatNumber(pool.pooled_acreage, 4)} ac
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-card px-4 py-3">
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="mt-1 flex items-center gap-1 text-sm font-medium text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {new Date(pool.entry_ts).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          {/* Contributing Shares List */}
          <SectionCard
            title="Contributing Shares"
            icon={Users}
            description="Each Form-A contribution traceable back to the constituent plot and claimant"
          >
            {pool.contributions.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                <Users className="h-8 w-8 opacity-40" />
                <p className="text-sm">No contributions recorded yet.</p>
              </div>
            ) : (
              <>
                <div className="overflow-hidden rounded-lg border border-border/60">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Claimant
                        </TableHead>
                        <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Claim Code
                        </TableHead>
                        <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Plot Number
                        </TableHead>
                        <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground text-right tabular-nums">
                          Share Acres
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pool.contributions.map((c, idx) => (
                        <TableRow
                          key={c.id}
                          className={idx % 2 === 1 ? 'bg-muted/20' : undefined}
                        >
                          <TableCell className="text-sm font-medium">{c.claimant_name}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {c.claim_code}
                          </TableCell>
                          <TableCell className="text-sm">{c.plot_number}</TableCell>
                          <TableCell className="text-right font-mono text-sm tabular-nums font-medium">
                            {formatNumber(c.share_acres, 4)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Sum row */}
                <div className="mt-3 flex items-center justify-between rounded-md bg-amber-50 px-4 py-2.5 dark:bg-amber-950/30">
                  <span className="text-xs font-medium text-amber-800 dark:text-amber-300">
                    Total pooled (decimal.js, no floats)
                  </span>
                  <span className="font-mono text-sm font-bold tabular-nums text-amber-700 dark:text-amber-300">
                    {formatNumber(pool.pooled_acreage, 4)} ac
                  </span>
                </div>
              </>
            )}
          </SectionCard>

          {/* Conditional CTA */}
          <SectionCard
            title="Next Steps"
            icon={TrendingUp}
            description={thresholdMet
              ? 'Threshold met — the nominee is now eligible to apply for employment.'
              : 'More contributions are needed before the nominee can apply for employment.'}
          >
            {thresholdMet ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    {pool.nominee_name} has crossed the 2.00-acre threshold and can proceed with the employment application.
                  </span>
                </div>
                <Button
                  className="gap-2 bg-emerald-600 px-6 text-white hover:bg-emerald-700"
                  onClick={() => setView('employment-wizard')}
                >
                  <Plus className="h-4 w-4" />
                  Apply for Employment
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                    {formatNumber(remaining, 4)} acres still needed before {pool.nominee_name} can apply.
                  </span>
                </div>
                <Button disabled className="gap-2 opacity-50">
                  <Plus className="h-4 w-4" />
                  Apply for Employment
                </Button>
              </div>
            )}
          </SectionCard>
        </>
      )}
    </div>
  )
}

// ─── Main Export ────────────────────────────────────────────────────────────

export function NominationView() {
  const { user } = useAuth();
  const {  nominationView,   } = useUiState()
  const isEcl = user?.portal === 'ecl'

  // When ECL user is on the list sub-view, show ECL-specific list
  // When on form/tracking, share the same components (data is per-user anyway)
  if (nominationView === 'form') return <NominationFormView />
  if (nominationView === 'tracking') return <TrackingView />

  // nominationView === 'list'
  return isEcl ? <EclListView /> : <PublicListView />
}
export default NominationView

