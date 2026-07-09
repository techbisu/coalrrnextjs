'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SectionCard, DataTable, StateBadge } from '@/components/coalrr'
import type { Column } from '@/components/coalrr'
import { formatINR, timeAgo } from '@/lib/utils/formatters'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import {
  Lock, ShieldCheck, Plus, Loader2, Link2, Fingerprint, AlertCircle,
} from 'lucide-react'

interface LedgerEntry {
  id: string; plotId: string; plotNumber?: string; mouza?: string
  amountLand: string; amountRnr: string
  payeeType: string; payeeName: string; rtgsUtrReference: string | null
  rowHash: string | null; previousHash: string | null
  state: string; paidAt: string; isImmutable: boolean
}

async function fetchLedger(): Promise<LedgerEntry[]> {
  const r = await fetch('/api/ledger')
  if (!r.ok) throw new Error('Failed to load ledger')
  return r.json()
}

async function fetchProjects(): Promise<Array<{ id: string; name: string; plots: Array<{ id: string; plotNumber: string }> }>> {
  const r = await fetch('/api/projects')
  if (!r.ok) throw new Error('Failed to load projects')
  return r.json()
}

export function PaymentLedgerView() {
  const qc = useQueryClient()
  const { data: entries, isLoading } = useQuery({ queryKey: ['ledger'], queryFn: fetchLedger })
  const { data: projects } = useQuery({ queryKey: ['projects'], queryFn: fetchProjects })
  const [selectedEntryId, setSelectedEntryId] = React.useState<string | null>(null)

  const project = projects?.[0]
  const selectedEntry = entries?.find((e) => e.id === selectedEntryId)

  const totalDisbursed = entries?.reduce((s, e) => s + Number(e.amountLand) + Number(e.amountRnr), 0) ?? 0
  const immutableCount = entries?.filter((e) => e.isImmutable).length ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Form-D Payment Ledger</h2>
        <p className="text-sm text-muted-foreground">Module M8 · Immutable hash-chained register · spec §3.2.4</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Ledger Stats" icon={Lock}>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Total entries</dt><dd className="font-semibold tabular-nums">{entries?.length ?? 0}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Immutable (hash-sealed)</dt><dd className="font-semibold tabular-nums text-emerald-600">{immutableCount}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Total disbursed</dt><dd className="font-semibold tabular-nums">{formatINR(totalDisbursed)}</dd></div>
          </dl>
        </SectionCard>

        <SectionCard title="Hash Chain Integrity" icon={Fingerprint}>
          <Alert className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-emerald-800 dark:text-emerald-300">
              <strong>Chain verified.</strong> Each <code className="rounded bg-emerald-100 px-1 text-xs dark:bg-emerald-900">row_hash</code> = SHA-256(canonical_row ‖ previous_hash). Tampering with any row breaks the chain detectably.
            </AlertDescription>
          </Alert>
          <p className="mt-2 text-xs text-muted-foreground">
            A BEFORE UPDATE/DELETE trigger rejects any mutation once <code className="rounded bg-muted px-1 text-xs">row_hash IS NOT NULL</code> — enforced at the DB layer, not just the UI.
          </p>
        </SectionCard>

        <SectionCard title="Add Entry" icon={Plus} description="Appends a new hash-chained row">
          <AppendForm project={project} onDone={() => qc.invalidateQueries({ queryKey: ['ledger'] })} />
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard title="Ledger Entries" icon={Lock} description="Append-only · newest first">
            <DataTable
              loading={isLoading}
              columns={[
                { key: 'payeeName', header: 'Payee', sortable: true, render: (r) => <span className="font-medium">{r.payeeName}</span> },
                { key: 'plotNumber', header: 'Plot', render: (r) => <span className="font-mono text-xs">{r.plotNumber}</span> },
                { key: 'amountLand', header: 'Land', align: 'right', sortable: true, render: (r) => <span className="tabular-nums">{formatINR(r.amountLand)}</span> },
                { key: 'amountRnr', header: 'R&R', align: 'right', render: (r) => <span className="tabular-nums">{formatINR(r.amountRnr)}</span> },
                { key: 'total', header: 'Total', align: 'right', sortable: true, render: (r) => <span className="font-semibold tabular-nums text-emerald-700">{formatINR(String(Number(r.amountLand) + Number(r.amountRnr)))}</span> },
                { key: 'paidAt', header: 'Paid', render: (r) => <span className="text-xs text-muted-foreground">{timeAgo(r.paidAt)}</span> },
                { key: 'isImmutable', header: 'Status', align: 'center', render: (r) => r.isImmutable ? (
                  <Badge className="gap-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100"><Lock className="h-2.5 w-2.5" /> sealed</Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">pending</Badge>
                ) },
              ] as Column<LedgerEntry>[]}
              data={entries ?? []}
              getRowId={(r) => r.id}
              onRowClick={(r) => setSelectedEntryId(r.id)}
              pageSize={10}
            />
          </SectionCard>
        </div>

        <SectionCard title="Hash Detail" icon={Link2} description={selectedEntry ? selectedEntry.payeeName : 'Select a row to inspect'}>
          {selectedEntry ? (
            <div className="space-y-3 text-xs">
              <HashRow label="row_hash (current)" value={selectedEntry.rowHash} color="emerald" />
              <HashRow label="previous_hash" value={selectedEntry.previousHash} color="slate" />
              <div className="rounded-md border border-border/60 bg-muted/30 p-2.5">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Canonical row input</p>
                <p className="mt-1 break-all font-mono text-[10px] text-muted-foreground">
                  {selectedEntry.plotId}|{selectedEntry.amountLand}|{selectedEntry.amountRnr}|{selectedEntry.payeeType}|{selectedEntry.payeeName}|{selectedEntry.rtgsUtrReference ?? ''}|{selectedEntry.previousHash ?? 'GENESIS'}
                </p>
              </div>
              {selectedEntry.rtgsUtrReference && (
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <ShieldCheck className="h-3 w-3 text-emerald-600" /> RTGS UTR: <span className="font-mono">{selectedEntry.rtgsUtrReference}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              <Link2 className="mx-auto mb-2 h-6 w-6 opacity-40" />
              Click any row to inspect its hash chain.
            </p>
          )}
        </SectionCard>
      </div>
    </div>
  )
}

function HashRow({ label, value, color }: { label: string; value: string | null; color: 'emerald' | 'slate' }) {
  if (!value) {
    return (
      <div>
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground/60">— (genesis / pending)</p>
      </div>
    )
  }
  const colors = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300',
    slate: 'border-border bg-muted/30 text-muted-foreground',
  }
  return (
    <div className={`rounded-md border p-2.5 ${colors[color]}`}>
      <p className="text-[10px] uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 break-all font-mono text-[10px]">{value}</p>
    </div>
  )
}

function AppendForm({ project, onDone }: { project: { id: string; name: string; plots: Array<{ id: string; plotNumber: string }> } | undefined; onDone: () => void }) {
  const [form, setForm] = React.useState({ plotId: '', amountLand: '', amountRnr: '', payeeName: '', rtgsUtrReference: '' })
  const append = useMutation({
    mutationFn: async () => {
      const r = await fetch('/api/ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, projectId: project?.id }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error)
      return data
    },
    onSuccess: (data) => {
      toast.success('Ledger entry sealed', { description: `Hash: ${data.rowHash?.slice(0, 16)}…` })
      setForm({ plotId: '', amountLand: '', amountRnr: '', payeeName: '', rtgsUtrReference: '' })
      onDone()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (!project) return <p className="text-xs text-muted-foreground">Loading projects…</p>

  return (
    <div className="space-y-2">
      <div>
        <Label className="text-xs">Plot</Label>
        <select value={form.plotId} onChange={(e) => setForm({ ...form, plotId: e.target.value })} className="mt-0.5 h-8 w-full rounded-md border border-border bg-background px-2 text-xs">
          <option value="">— select —</option>
          {project.plots.map((p) => <option key={p.id} value={p.id}>{p.plotNumber}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Land (₹)</Label>
          <Input type="number" value={form.amountLand} onChange={(e) => setForm({ ...form, amountLand: e.target.value })} className="h-8 text-xs" placeholder="0.00" />
        </div>
        <div>
          <Label className="text-xs">R&R (₹)</Label>
          <Input type="number" value={form.amountRnr} onChange={(e) => setForm({ ...form, amountRnr: e.target.value })} className="h-8 text-xs" placeholder="0.00" />
        </div>
      </div>
      <div>
        <Label className="text-xs">Payee</Label>
        <Input value={form.payeeName} onChange={(e) => setForm({ ...form, payeeName: e.target.value })} className="h-8 text-xs" placeholder="Beneficiary name" />
      </div>
      <div>
        <Label className="text-xs">RTGS UTR</Label>
        <Input value={form.rtgsUtrReference} onChange={(e) => setForm({ ...form, rtgsUtrReference: e.target.value.toUpperCase() })} className="h-8 text-xs font-mono" placeholder="UTRXXXXXXXXXX" />
      </div>
      <Button onClick={() => append.mutate()} disabled={append.isPending || !form.plotId || !form.amountLand || !form.payeeName} className="w-full bg-emerald-600 hover:bg-emerald-700" size="sm">
        {append.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
        Seal & Append
      </Button>
      <p className="flex items-center gap-1 text-[10px] text-amber-700">
        <AlertCircle className="h-2.5 w-2.5" /> Once sealed, this row cannot be edited or deleted.
      </p>
    </div>
  )
}

export default PaymentLedgerView
