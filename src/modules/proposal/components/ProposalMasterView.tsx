'use client'

import React, { useState } from 'react'
import { SectionCard } from '@/shared/components/coalrr/SectionCard'
import { ProjectSelect, AreaSelect, MineSelect } from '@/shared/components/coalrr/selects'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

import { MODES, MODE_META } from '@/modules/land-acquisition/types'
import { Plus, Loader2, ClipboardList } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert'

interface PlotEntry {
  plot_no: string;
  mouza_lgd: number;
  to_be_acquired_area: number;
  landt_id: number;
}

export function ProposalMasterView() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [proposal, setProposal] = useState({
    proposal_no: '',
    proposal_dt: new Date().toISOString().split('T')[0],
    mine_cd: '',
    area_cd: '',
    proj_cd: '',
    acq_mode_id: 1, // Defaulting to first mode mapping, can be handled dynamically
    purpose_justification: '',
    is_within_pr_limit: true,
    requires_board_approval: false,
    entry_by: 'system'
  })

  const [plots, setPlots] = useState<PlotEntry[]>([
    { plot_no: '', mouza_lgd: 0, to_be_acquired_area: 0, landt_id: 0 }
  ])

  const handleAddPlot = () => {
    setPlots([...plots, { plot_no: '', mouza_lgd: 0, to_be_acquired_area: 0, landt_id: 0 }])
  }

  const handlePlotChange = (index: number, field: keyof PlotEntry, value: any) => {
    const newPlots = [...plots]
    newPlots[index] = { ...newPlots[index], [field]: value }
    setPlots(newPlots)
  }

  const handleRemovePlot = (index: number) => {
    if (plots.length > 1) {
      const newPlots = [...plots]
      newPlots.splice(index, 1)
      setPlots(newPlots)
    }
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      
      // Map simplified UI plots into the complex API DTO
      const mappedPlots = plots.map(p => ({
        plot_no: p.plot_no,
        mouza_lgd: Number(p.mouza_lgd),
        to_be_acquired_area: Number(p.to_be_acquired_area),
        entry_by: proposal.entry_by
      }))

      const mappedLandTypes = plots.map(p => ({
        schedule_id: p.plot_no, // using plot_no as the link ID for creation
        landt_id: Number(p.landt_id),
        area: Number(p.to_be_acquired_area),
        area_to_acquire: Number(p.to_be_acquired_area)
      }))

      const payload = {
        proposal: {
          ...proposal,
          acq_mode_id: Number(proposal.acq_mode_id)
        },
        plots: mappedPlots,
        landTypes: mappedLandTypes
      }

      const res = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 409) {
          toast.error('Math Engine Hard Stop: Duplicate plots detected!')
        } else {
          toast.error(data.error || 'Failed to create proposal')
        }
        return
      }

      toast.success('Proposal initiated successfully!')
      router.push(`/proposals/${data.proposalId}/verify`)
      
    } catch (error) {
      console.error(error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Initiate Land Acquisition Proposal</h2>
        <p className="text-sm text-muted-foreground">
          Module M2 · Plot schedules · CL-1 mode-specific checklists · spec §1.2.1 Journey A
        </p>
      </div>

      <Alert>
        <ClipboardList className="h-4 w-4" />
        <AlertTitle>Drafting State</AlertTitle>
        <AlertDescription>
          Create your land acquisition proposal against a project. Adding plots automatically runs the Anti-Duplication Math Engine.
        </AlertDescription>
      </Alert>

      <SectionCard title="1. Proposal Details">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Mode Selector matching CreateProposalDialog UI */}
          <div className="col-span-full space-y-2 mb-4">
            <label className="text-sm font-medium text-muted-foreground">Acquisition Mode (drives CL-1.x checklist)</label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {MODES.map((m) => {
                const meta = MODE_META[m]
                const selected = proposal.acq_mode_id === m
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                       setProposal({ ...proposal, acq_mode_id: m })
                    }}
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

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Proposal Number</label>
            <Input 
              value={proposal.proposal_no} 
              onChange={e => setProposal({...proposal, proposal_no: e.target.value})}
              placeholder="e.g. PROP-2026-001"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Notification Date</label>
            <Input 
              type="date"
              value={proposal.proposal_dt} 
              onChange={e => setProposal({...proposal, proposal_dt: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Project</label>
            <ProjectSelect 
              value={proposal.proj_cd}
              onChange={v => setProposal({...proposal, proj_cd: v as string})}
              placeholder="Select project..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Area Office</label>
            <AreaSelect 
              value={proposal.area_cd}
              onChange={v => setProposal({...proposal, area_cd: v as string})}
              placeholder="Select area..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Colliery / Mine</label>
            <MineSelect 
              areaCd={proposal.area_cd}
              value={proposal.mine_cd}
              onChange={v => setProposal({...proposal, mine_cd: v as string})}
              placeholder="Select mine..."
            />
          </div>
        </div>
        <div className="mt-6 space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Proposal Title / Description</label>
          <textarea 
            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            value={proposal.purpose_justification}
            onChange={e => setProposal({...proposal, purpose_justification: e.target.value})}
            placeholder="Brief scope, affected mouzas, rationale..."
          />
        </div>
        <div className="mt-6 flex gap-6">
          <div className="flex items-center space-x-2">
            <Checkbox 
              checked={proposal.is_within_pr_limit}
              onCheckedChange={(c) => setProposal({...proposal, is_within_pr_limit: !!c})}
            />
            <label className="text-sm font-medium leading-none text-muted-foreground">Within PR Limit</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              checked={proposal.requires_board_approval}
              onCheckedChange={(c) => setProposal({...proposal, requires_board_approval: !!c})}
            />
            <label className="text-sm font-medium leading-none text-muted-foreground">Requires Board Approval</label>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="2. Plot Schedule Data Grid">
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Plot No</th>
                <th className="px-4 py-3 font-medium">Mouza LGD</th>
                <th className="px-4 py-3 font-medium">Land Type ID</th>
                <th className="px-4 py-3 font-medium">Acquisition Area (Acres)</th>
                <th className="px-4 py-3 font-medium w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {plots.map((plot, idx) => (
                <tr key={idx} className="bg-card">
                  <td className="p-2">
                    <Input 
                      value={plot.plot_no}
                      onChange={e => handlePlotChange(idx, 'plot_no', e.target.value)}
                      placeholder="Dag No"
                    />
                  </td>
                  <td className="p-2">
                    <Input 
                      type="number"
                      value={plot.mouza_lgd || ''}
                      onChange={e => handlePlotChange(idx, 'mouza_lgd', Number(e.target.value))}
                      placeholder="LGD Code"
                    />
                  </td>
                  <td className="p-2">
                    <Input 
                      type="number"
                      value={plot.landt_id || ''}
                      onChange={e => handlePlotChange(idx, 'landt_id', Number(e.target.value))}
                      placeholder="Type ID (e.g., Tribal)"
                    />
                  </td>
                  <td className="p-2">
                    <Input 
                      type="number"
                      step="0.01"
                      value={plot.to_be_acquired_area || ''}
                      onChange={e => handlePlotChange(idx, 'to_be_acquired_area', Number(e.target.value))}
                      placeholder="0.0000"
                    />
                  </td>
                  <td className="p-2 text-center">
                    <Button variant="destructive" size="sm" onClick={() => handleRemovePlot(idx)} disabled={plots.length === 1}>
                      X
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 bg-muted/20 border-t">
            <Button variant="outline" size="sm" onClick={handleAddPlot}>+ Add Plot Row</Button>
          </div>
        </div>
      </SectionCard>

      <div className="flex justify-end pt-4 gap-3 border-t mt-8">
        <Button variant="outline" onClick={() => router.push('/proposals')}>Cancel</Button>
        <Button 
          className="bg-emerald-600 hover:bg-emerald-700" 
          size="lg" 
          onClick={handleSubmit} 
          disabled={loading || !proposal.acq_mode_id || !proposal.proj_cd}
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
          {loading ? 'Processing via Math Engine...' : 'Initiate Proposal & Verify Plots'}
        </Button>
      </div>
    </div>
  )
}
