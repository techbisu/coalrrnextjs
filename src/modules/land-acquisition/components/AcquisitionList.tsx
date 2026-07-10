import * as React from 'react'
import Link from 'next/link'
import { ClipboardList, Layers } from 'lucide-react'
import { StateBadge } from '@/components/coalrr'
import { formatNumber, timeAgo } from '@/lib/utils/formatters'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { MODE_META, ANNEXURE_META, ScheduleListItem } from '../types'
import { NewProposalAction } from './NewProposalAction'
import { Can } from '@/authorization/components/Can'

function AnnexurePill({ tag, count }: { tag: 'A' | 'B' | 'C'; count: number }) {
  const meta = ANNEXURE_META[tag]
  return (
    <div className={`rounded-md border px-2 py-1 ${meta.color}`}>
      <div className="text-[10px] font-semibold uppercase">{meta.label}</div>
      <div className="text-sm font-bold tabular-nums">{count}</div>
    </div>
  )
}

export function AcquisitionList({ schedules }: { schedules: ScheduleListItem[] }) {
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
          <NewProposalAction />
        </Can>
      </div>

      {schedules.length === 0 ? (
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
              <Link
                key={s.id}
                href={`/proposals?schedule_id=${s.id}`}
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
                  <AnnexurePill tag="A" count={s.itemSummary?.annexure_a ?? 0} />
                  <AnnexurePill tag="B" count={s.itemSummary?.annexure_b ?? 0} />
                  <AnnexurePill tag="C" count={s.itemSummary?.annexure_c ?? 0} />
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Layers className="h-3 w-3" />
                    {formatNumber(s.total_area_acres, 4)} ac
                  </span>
                  <span>{timeAgo(String(s.entry_ts))}</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
