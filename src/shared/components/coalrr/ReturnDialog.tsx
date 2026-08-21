'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { RotateCcw, Loader2, AlertCircle } from 'lucide-react'

export interface ReturnDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityType: string
  entityId: string
  targetState: string
  actionLabel?: string
  onSuccess?: () => void
}

export function ReturnDialog({
  open,
  onOpenChange,
  entityType,
  entityId,
  targetState,
  actionLabel = 'Return for Correction',
  onSuccess,
}: ReturnDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reason, setReason] = useState('')

  const handleReturn = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason / correction instructions before returning.')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const res = await fetch('/api/workflow/transition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType,
          entityId,
          toState: targetState,
          actionName: actionLabel,
          justification: reason,
        }),
      })

      const json = await res.json()
      if (json.ok) {
        onOpenChange(false)
        if (onSuccess) onSuccess()
      } else {
        setError(json.reason ?? json.error ?? 'Return transition blocked by workflow engine')
      }
    } catch (e: any) {
      setError(e.message ?? 'Failed to execute return transition')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <RotateCcw className="w-5 h-5" />
            {actionLabel}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 text-xs bg-destructive/10 border border-destructive/30 rounded-md text-destructive flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3 py-2">
          <p className="text-xs text-muted-foreground">
            The proposal will be returned to stage <span className="font-semibold">{targetState}</span>. Please specify the required corrections or missing documents.
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="return-reason" className="text-xs font-semibold">
              Return Reason & Correction Instructions *
            </Label>
            <Textarea
              id="return-reason"
              placeholder="Specify what needs to be corrected or resubmitted..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="text-xs"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleReturn} disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RotateCcw className="w-4 h-4 mr-2" />}
            Confirm Return
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
