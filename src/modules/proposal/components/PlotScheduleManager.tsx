'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { AddPlotDialog } from './AddPlotDialog'
import { Pencil } from 'lucide-react'
import { Can } from '@/authorization/components/Can'

export const PLOT_TYPES = [
  { value: '1', label: '1 - LR' },
  { value: '2', label: '2 - RS' },
  { value: '3', label: '3 - CS' }
]

export function PlotScheduleManager({ 
  proposalId, 
  isDrafting, 
  projectStateLgd, 
  projectMouzas, 
  editPlotId,
  setEditPlotId,
  onChanged 
}: { 
  proposalId: string, 
  isDrafting: boolean, 
  projectStateLgd: string, 
  projectMouzas: string[], 
  editPlotId: string | null,
  setEditPlotId: (id: string | null) => void,
  onChanged: () => void 
}) {
  const [open, setOpen] = useState(false)

  // Sync dialog open state with editPlotId
  useEffect(() => {
    if (editPlotId) setOpen(true)
  }, [editPlotId])

  const handleOpenChange = (v: boolean) => {
    setOpen(v)
    if (!v) setEditPlotId(null)
  }

  if (!isDrafting) return null

  return (
    <>
      <Can permission="proposal.addplot">
        <Button onClick={() => setOpen(true)} className="gap-2" size="sm">
          <Plus className="w-4 h-4" /> Add Plot
        </Button>
      </Can>

      <AddPlotDialog 
        open={open} 
        onOpenChange={handleOpenChange} 
        proposalId={proposalId}
        projectStateLgd={projectStateLgd}
        projectMouzas={projectMouzas}
        editPlotId={editPlotId}
        onSuccess={() => {
          onChanged()
        }}
      />
    </>
  )
}
