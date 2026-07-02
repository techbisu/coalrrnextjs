'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SectionCard, DataTable } from '@/components/coalrr'
import type { Column } from '@/components/coalrr'
import { useCoalrr, timeAgo } from '@/components/coalrr/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
  DialogFooter,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  Users,
  Plus,
  Search,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  IdCard,
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'homestead', label: 'Homestead', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
  { value: 'shifting_allowance', label: 'Shifting Allowance', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  { value: 'cattle_shed', label: 'Cattle Shed', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' },
  { value: 'subsistence_grant', label: 'Subsistence Grant', color: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300' },
] as const

const SC_ST_OBC_OPTIONS = [
  { value: 'sc', label: 'SC' },
  { value: 'st', label: 'ST' },
  { value: 'obc', label: 'OBC' },
  { value: 'general', label: 'General' },
] as const

type CategoryValue = (typeof CATEGORIES)[number]['value']

function getCategoryMeta(value: string) {
  return CATEGORIES.find((c) => c.value === value) ?? { label: value, color: 'bg-muted text-muted-foreground' }
}

// ─── Types ────────────────────────────────────────────────────────────

interface PafRecord {
  id: string
  pafId: string
  claimantName: string
  categoryOfEntitlement: string
  scStObcCategory: string | null
  plotId: string | null
  plotNumber: string | null
  mouza: string | null
  photoIdentityCardDoc: string | null
  createdAt: string
}

interface PlotOption {
  id: string
  plotNumber: string
  mouza?: string | null
}

// ─── API helpers ──────────────────────────────────────────────────────

async function fetchPafRecords(): Promise<PafRecord[]> {
  const r = await fetch('/api/paf')
  if (!r.ok) throw new Error('Failed to load PAF census records')
  return r.json()
}

async function fetchPlots(): Promise<PlotOption[]> {
  const r = await fetch('/api/plots')
  if (!r.ok) throw new Error('Failed to load plots')
  return r.json()
}

// ─── Component ────────────────────────────────────────────────────────

export function PafCensusView() {
  const qc = useQueryClient()

  // ── Queries ───────────────────────────────────────────────────────
  const {
    data: records,
    isLoading,
    isError,
    error,
  } = useQuery<PafRecord[]>({
    queryKey: ['paf-census'],
    queryFn: fetchPafRecords,
  })

  const { data: plots } = useQuery<PlotOption[]>({
    queryKey: ['plots'],
    queryFn: fetchPlots,
  })

  // ── Filters ───────────────────────────────────────────────────────
  const [filterCategory, setFilterCategory] = React.useState<string>('all')
  const [filterCaste, setFilterCaste] = React.useState<string>('all')
  const [filterMouza, setFilterMouza] = React.useState('')

  const filtered = React.useMemo(() => {
    if (!records) return []
    let result = records
    if (filterCategory !== 'all') {
      result = result.filter((r) => r.categoryOfEntitlement === filterCategory)
    }
    if (filterCaste !== 'all') {
      result = result.filter((r) => r.scStObcCategory === filterCaste)
    }
    if (filterMouza.trim()) {
      const q = filterMouza.toLowerCase()
      result = result.filter((r) => r.mouza?.toLowerCase().includes(q))
    }
    return result
  }, [records, filterCategory, filterCaste, filterMouza])

  // ── Summary stats ─────────────────────────────────────────────────
  const totalRecords = records?.length ?? 0
  const photoGenerated = records?.filter((r) => r.photoIdentityCardDoc).length ?? 0
  const photoPending = totalRecords - photoGenerated

  // ── Dialog state ──────────────────────────────────────────────────
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingRecord, setEditingRecord] = React.useState<PafRecord | null>(null)

  // ── Delete confirmation ───────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = React.useState<PafRecord | null>(null)

  // ── Mutations ─────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async (body: {
      claimantName: string
      categoryOfEntitlement: string
      scStObcCategory?: string
      plotId?: string
    }) => {
      const r = await fetch('/api/paf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'Failed to create PAF record')
      return data
    },
    onSuccess: () => {
      toast.success('PAF record created', {
        description: 'Census entry has been added to the register.',
      })
      closeDialog()
      qc.invalidateQueries({ queryKey: ['paf-census'] })
    },
    onError: (e: Error) => toast.error('Create failed', { description: e.message }),
  })

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string
      body: {
        claimantName: string
        categoryOfEntitlement: string
        scStObcCategory?: string
        plotId?: string
      }
    }) => {
      const r = await fetch(`/api/paf/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'Failed to update PAF record')
      return data
    },
    onSuccess: () => {
      toast.success('PAF record updated', {
        description: 'Census entry has been saved.',
      })
      closeDialog()
      qc.invalidateQueries({ queryKey: ['paf-census'] })
    },
    onError: (e: Error) => toast.error('Update failed', { description: e.message }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/paf/${id}`, { method: 'DELETE' })
      if (!r.ok) {
        const data = await r.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to delete PAF record')
      }
    },
    onSuccess: () => {
      toast.success('PAF record deleted')
      setDeleteTarget(null)
      qc.invalidateQueries({ queryKey: ['paf-census'] })
    },
    onError: (e: Error) => toast.error('Delete failed', { description: e.message }),
  })

  // ── Dialog helpers ────────────────────────────────────────────────
  function openCreate() {
    setEditingRecord(null)
    setDialogOpen(true)
  }

  function openEdit(record: PafRecord) {
    setEditingRecord(record)
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setEditingRecord(null)
  }

  // ── Photo ID generation (simulated) ───────────────────────────────
  const [generating, setGenerating] = React.useState(false)
  function handleGeneratePhotoIds() {
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      toast.success('Photo ID cards generated', {
        description: `${photoPending} pending cards queued for processing.`,
      })
    }, 2000)
  }

  // ── CSV export (simulated) ────────────────────────────────────────
  function handleExport() {
    const rows = filtered
    if (!rows.length) {
      toast.warning('No records to export')
      return
    }
    const header = 'PAF ID,Claimant Name,Category,SC/ST/OBC,Plot Number,Mouza,Photo ID Status,Created At'
    const csv = [
      header,
      ...rows.map(
        (r) =>
          [
            r.pafId,
            `"${r.claimantName}"`,
            getCategoryMeta(r.categoryOfEntitlement).label,
            r.scStObcCategory?.toUpperCase() ?? '—',
            r.plotNumber ?? '—',
            `"${r.mouza ?? ''}"`,
            r.photoIdentityCardDoc ? 'Generated' : 'Pending',
            r.createdAt,
          ].join(','),
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `paf-census-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exported', { description: `${rows.length} records downloaded.` })
  }

  // ── Columns ───────────────────────────────────────────────────────
  const columns: Column<PafRecord>[] = [
      {
        key: 'pafId',
        header: 'PAF ID',
        sortable: true,
        className: 'w-[130px]',
        render: (r) => (
          <span className="font-mono text-xs font-semibold text-amber-800 dark:text-amber-300">
            {r.pafId}
          </span>
        ),
      },
      {
        key: 'claimantName',
        header: 'Claimant Name',
        sortable: true,
        render: (r) => <span className="font-medium">{r.claimantName}</span>,
      },
      {
        key: 'categoryOfEntitlement',
        header: 'Category',
        sortable: true,
        align: 'center',
        render: (r) => {
          const cat = getCategoryMeta(r.categoryOfEntitlement)
          return (
            <Badge variant="secondary" className={cat.color}>
              {cat.label}
            </Badge>
          )
        },
      },
      {
        key: 'scStObcCategory',
        header: 'SC/ST/OBC',
        align: 'center',
        render: (r) =>
          r.scStObcCategory ? (
            <Badge variant="outline" className="text-[11px] font-semibold uppercase">
              {r.scStObcCategory}
            </Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        key: 'plotMouza',
        header: 'Plot / Mouza',
        render: (r) => (
          <span className="text-xs">
            {r.plotNumber && (
              <span className="font-mono text-muted-foreground">{r.plotNumber}</span>
            )}
            {r.plotNumber && r.mouza && (
              <span className="text-muted-foreground/50 mx-1">·</span>
            )}
            {r.mouza && <span>{r.mouza}</span>}
            {!r.plotNumber && !r.mouza && (
              <span className="text-muted-foreground">—</span>
            )}
          </span>
        ),
      },
      {
        key: 'photoIdentityCardDoc',
        header: 'Photo ID',
        align: 'center',
        render: (r) =>
          r.photoIdentityCardDoc ? (
            <Badge className="gap-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300">
              <CheckCircle2 className="h-3 w-3" />
              Generated
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-muted-foreground">
              <AlertCircle className="h-3 w-3" />
              Pending
            </Badge>
          ),
      },
      {
        key: 'createdAt',
        header: 'Created',
        sortable: true,
        render: (r) => (
          <span className="text-xs text-muted-foreground">{timeAgo(r.createdAt)}</span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'center',
        className: 'w-[140px]',
        render: (r) => (
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-amber-700 hover:bg-amber-50 hover:text-amber-900 dark:text-amber-400 dark:hover:bg-amber-950/40"
              onClick={(e) => {
                e.stopPropagation()
                openEdit(r)
              }}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-800 dark:text-red-400 dark:hover:bg-red-950/40"
              onClick={(e) => {
                e.stopPropagation()
                setDeleteTarget(r)
              }}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ]

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
            <Users className="h-5 w-5 text-amber-700 dark:text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">PAF Census Register</h2>
              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300">
                M6
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              ECL Internal Portal · Photo-attached family census for R&R beneficiaries
            </p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SectionCard title="Total Records">
          <p className="text-2xl font-bold tabular-nums text-amber-700 dark:text-amber-400">
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin inline" /> : totalRecords}
          </p>
          <p className="text-xs text-muted-foreground">PAF census entries</p>
        </SectionCard>

        <SectionCard title="Photo IDs Generated">
          <p className="text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin inline" /> : photoGenerated}
          </p>
          <p className="text-xs text-muted-foreground">Identity cards issued</p>
        </SectionCard>

        <SectionCard title="Photo IDs Pending">
          <p className="text-2xl font-bold tabular-nums text-stone-500 dark:text-stone-400">
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin inline" /> : photoPending}
          </p>
          <p className="text-xs text-muted-foreground">Awaiting generation</p>
        </SectionCard>
      </div>

      {/* Filter rail */}
      <div className="rounded-lg border border-border/60 bg-background p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          {/* Category filter */}
          <div className="flex flex-col gap-1.5 sm:w-[200px]">
            <Label className="text-xs font-medium text-muted-foreground">Category</Label>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* SC/ST/OBC filter */}
          <div className="flex flex-col gap-1.5 sm:w-[160px]">
            <Label className="text-xs font-medium text-muted-foreground">SC / ST / OBC</Label>
            <Select value={filterCaste} onValueChange={setFilterCaste}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {SC_ST_OBC_OPTIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mouza search */}
          <div className="flex flex-1 flex-col gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Mouza</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filterMouza}
                onChange={(e) => setFilterMouza(e.target.value)}
                placeholder="Search mouza…"
                className="h-9 pl-8 text-xs"
              />
              {filterMouza && (
                <button
                  type="button"
                  onClick={() => setFilterMouza('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Spacer */}
          <div className="hidden flex-1 sm:block" />

          {/* Active filter count */}
          {(filterCategory !== 'all' || filterCaste !== 'all' || filterMouza.trim()) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                {filtered.length} of {totalRecords}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setFilterCategory('all')
                  setFilterCaste('all')
                  setFilterMouza('')
                }}
              >
                Clear
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            onClick={openCreate}
            className="gap-1.5 bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-800"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            Add PAF Record
          </Button>
          <Button
            variant="outline"
            onClick={handleGeneratePhotoIds}
            disabled={generating || photoPending === 0}
            className="gap-1.5 text-amber-700 border-amber-200 hover:bg-amber-50 hover:text-amber-900 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/40"
            size="sm"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <IdCard className="h-4 w-4" />
            )}
            Generate Photo IDs
          </Button>
        </div>

        <Button
          variant="outline"
          onClick={handleExport}
          disabled={filtered.length === 0}
          className="gap-1.5 text-xs"
          size="sm"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </Button>
      </div>

      <Separator />

      {/* Data table */}
      {isError ? (
        <SectionCard>
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="font-semibold text-red-700 dark:text-red-400">
                Failed to load census records
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {(error as Error)?.message ?? 'An unexpected error occurred.'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => qc.invalidateQueries({ queryKey: ['paf-census'] })}
              className="mt-1"
            >
              Retry
            </Button>
          </div>
        </SectionCard>
      ) : (
        <SectionCard title="Census Entries" description="PAF family register with entitlement categories">
          <DataTable<PafRecord>
            loading={isLoading}
            columns={columns}
            data={filtered}
            getRowId={(r) => r.id}
            emptyMessage={
              filterCategory !== 'all' || filterCaste !== 'all' || filterMouza.trim()
                ? 'No records match the active filters. Try adjusting your search criteria.'
                : 'No PAF census records yet. Click "Add PAF Record" to create the first entry.'
            }
            searchable={false}
            pageSize={10}
          />
        </SectionCard>
      )}

      {/* ── Add / Edit Dialog ──────────────────────────────────────── */}
      <PafFormDialog
        open={dialogOpen}
        editing={editingRecord}
        plots={plots ?? []}
        onClose={closeDialog}
        onSubmit={(body) => {
          if (editingRecord) {
            updateMutation.mutate({ id: editingRecord.id, body })
          } else {
            createMutation.mutate(body)
          }
        }}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* ── Delete Confirmation Dialog ─────────────────────────────── */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              Delete PAF Record
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete the PAF record for{' '}
            <span className="font-semibold text-foreground">
              {deleteTarget?.claimantName}
            </span>{' '}
            (<span className="font-mono text-xs">{deleteTarget?.pafId}</span>)?
            This action cannot be undone.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
              className="gap-1.5"
            >
              {deleteMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Form Dialog ──────────────────────────────────────────────────────

interface PafFormDialogProps {
  open: boolean
  editing: PafRecord | null
  plots: PlotOption[]
  onClose: () => void
  onSubmit: (body: {
    claimantName: string
    categoryOfEntitlement: string
    scStObcCategory?: string
    plotId?: string
  }) => void
  isSubmitting: boolean
}

function PafFormDialog({
  open,
  editing,
  plots,
  onClose,
  onSubmit,
  isSubmitting,
}: PafFormDialogProps) {
  const [claimantName, setClaimantName] = React.useState('')
  const [categoryOfEntitlement, setCategoryOfEntitlement] = React.useState<CategoryValue | ''>('')
  const [scStObcCategory, setScStObcCategory] = React.useState('')
  const [plotId, setPlotId] = React.useState('')

  // Sync form when editing record changes
  React.useEffect(() => {
    if (editing) {
      setClaimantName(editing.claimantName)
      setCategoryOfEntitlement(editing.categoryOfEntitlement as CategoryValue)
      setScStObcCategory(editing.scStObcCategory ?? '')
      setPlotId(editing.plotId ?? '')
    } else {
      setClaimantName('')
      setCategoryOfEntitlement('')
      setScStObcCategory('')
      setPlotId('')
    }
  }, [editing, open])

  const isFormValid =
    claimantName.trim().length > 0 && categoryOfEntitlement !== ''

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isFormValid) return

    const body: Parameters<typeof onSubmit>[0] = {
      claimantName: claimantName.trim(),
      categoryOfEntitlement,
    }
    if (scStObcCategory) body.scStObcCategory = scStObcCategory
    if (plotId) body.plotId = plotId

    onSubmit(body)
  }

  const selectedPlot = plots.find((p) => p.id === plotId)

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IdCard className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            {editing ? 'Edit PAF Record' : 'Add PAF Record'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Claimant Name */}
          <div className="space-y-1.5">
            <Label htmlFor="paf-claimant" className="text-sm font-medium">
              Claimant Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="paf-claimant"
              value={claimantName}
              onChange={(e) => setClaimantName(e.target.value)}
              placeholder="Full name of the claimant"
              className="h-10"
              autoFocus
            />
          </div>

          {/* Category of Entitlement */}
          <div className="space-y-1.5">
            <Label htmlFor="paf-category" className="text-sm font-medium">
              Category of Entitlement <span className="text-red-500">*</span>
            </Label>
            <Select
              value={categoryOfEntitlement}
              onValueChange={(v) => setCategoryOfEntitlement(v as CategoryValue)}
            >
              <SelectTrigger id="paf-category" className="h-10">
                <SelectValue placeholder="Select category…" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* SC/ST/OBC Category */}
          <div className="space-y-1.5">
            <Label htmlFor="paf-caste" className="text-sm font-medium">
              SC / ST / OBC Category
            </Label>
            <Select value={scStObcCategory} onValueChange={setScStObcCategory}>
              <SelectTrigger id="paf-caste" className="h-10">
                <SelectValue placeholder="Select caste category…" />
              </SelectTrigger>
              <SelectContent>
                {SC_ST_OBC_OPTIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Plot Assignment */}
          <div className="space-y-1.5">
            <Label htmlFor="paf-plot" className="text-sm font-medium">
              Plot Assignment
            </Label>
            <Select value={plotId} onValueChange={setPlotId}>
              <SelectTrigger id="paf-plot" className="h-10">
                <SelectValue placeholder="Select plot (optional)…" />
              </SelectTrigger>
              <SelectContent>
                {plots.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="font-mono text-xs">{p.plotNumber}</span>
                    {p.mouza && (
                      <span className="ml-2 text-muted-foreground">
                        · {p.mouza}
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPlot?.mouza && (
              <p className="text-xs text-muted-foreground">
                Mouza: {selectedPlot.mouza}
              </p>
            )}
          </div>

          <Separator />

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !isFormValid}
              className="gap-1.5 bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-800"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? 'Save Changes' : 'Create Record'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}