'use client'

import * as React from 'react'
import { Can } from '@/core/authorization/components/Can'
import { StateBadge } from '@/components/coalrr'
import { formatNumber, timeAgo } from '@/lib/utils/formatters'
import { Button } from '@/shared/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert'
import { Badge } from '@/shared/components/ui/badge'
import { ClipboardList, Plus, Layers } from 'lucide-react'
import { ScheduleListItem, MODE_META, ANNEXURE_META } from '../types'
import { CreateProposalDialog } from './CreateProposalDialog'

export function AcquisitionListView({
  schedules, loading, onSelect, onCreated,
}: {
  schedules: ScheduleListItem[]
  loading: boolean
  onSelect: (id: string, code: string) => void
  onCreated: (id: string) => void
}) {
  const [createOpen, setCreateOpen] = React.useState(false)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Land Acquisition Proposals</h2>
          <p className="text-sm text-muted-foreground">
            Module M2 · Plot schedules · CL-1 mode-specific checklists · spec §1.2.1 Journey A
          </p>
        </div>
        <Can permission="acquisition.create">
          <Button onClick={() => setCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4" /> New Proposal
          </Button>
        </Can>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-lg border border-border/60 bg-muted/40" />
          ))}
        </div>
      ) : schedules.length === 0 ? (
        <Alert>
          <ClipboardList className="h-4 w-4" />
          <AlertTitle>No acquisition proposals yet</AlertTitle>
          <AlertDescription>
            Create your first land acquisition proposal against a locked project baseline to begin the
            CL-1 checklist + area/HQ vetting workflow.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {schedules.map((s) => {
            const mode = MODE_META[s.acquisition_mode] ?? {
              label: s.acquisition_mode, checklistCode: 'CL-1', color: 'border-slate-300 bg-slate-50 text-slate-700',
            }
            return (
              <button
                key={s.id}
                onClick={() => onSelect(s.id, s.schedule_code)}
                className="group flex flex-col rounded-lg border border-border/60 bg-card p-4 text-left transition hover:border-amber-300 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm font-medium">{s.schedule_code}</span>
                  <StateBadge state={s.state} />
                </div>

                <h3 className="mt-2 line-clamp-1 text-sm font-semibold">{s.proposal_title}</h3>
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{s.projectName}</p>

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className={`font-mono text-[10px] ${mode.color}`}>
                    {mode.checklistCode} · {mode.label}
                  </Badge>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border/60 pt-3 text-center">
                  <AnnexurePill tag="A" count={s.itemSummary.annexure_a} />
                  <AnnexurePill tag="B" count={s.itemSummary.annexure_b} />
                  <AnnexurePill tag="C" count={s.itemSummary.annexure_c} />
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Layers className="h-3 w-3" />
                    {formatNumber(s.total_area_acres, 4)} ac
                  </span>
                  <span>{timeAgo(s.entry_ts)}</span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <CreateProposalDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}

function AnnexurePill({ tag, count }: { tag: 'A' | 'B' | 'C'; count: number }) {
  const meta = ANNEXURE_META[tag]
  return (
    <div className={`rounded-md border px-2 py-1 ${meta.color}`}>
      <div className="text-[10px] font-semibold uppercase">{meta.label}</div>
      <div className="text-sm font-bold tabular-nums">{count}</div>
    </div>
  )
}
