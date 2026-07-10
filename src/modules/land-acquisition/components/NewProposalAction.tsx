'use client'

import * as React from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CreateProposalDialog } from './CreateProposalDialog'

export function NewProposalAction() {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
        <Plus className="h-4 w-4" /> New Proposal
      </Button>
      <CreateProposalDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
