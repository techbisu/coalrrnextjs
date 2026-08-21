'use client'

import React, { useState, useEffect } from 'react'
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
import { Send, Loader2, UserCheck, AlertCircle } from 'lucide-react'

export interface RecipientOption {
  userId: number
  name: string
  email: string | null
  designation: string | null
  role: string
  area_cd: string | null
  mine_cd: string | null
}

export interface ForwardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityType: string
  entityId: string
  targetState: string
  targetRole?: string
  actionLabel?: string
  onSuccess?: () => void
}

export function ForwardDialog({
  open,
  onOpenChange,
  entityType,
  entityId,
  targetState,
  targetRole = 'area_office',
  actionLabel = 'Forward Proposal',
  onSuccess,
}: ForwardDialogProps) {
  const [loadingRecipients, setLoadingRecipients] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recipients, setRecipients] = useState<RecipientOption[]>([])
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [comments, setComments] = useState('')

  useEffect(() => {
    if (open && entityType && entityId) {
      fetchRecipients()
    }
  }, [open, entityType, entityId, targetRole])

  const fetchRecipients = async () => {
    try {
      setLoadingRecipients(true)
      setError(null)
      const res = await fetch(
        `/api/workflow/recipients?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}&targetRole=${encodeURIComponent(targetRole)}`
      )
      const json = await res.json()
      if (json.ok && Array.isArray(json.recipients)) {
        setRecipients(json.recipients)
        if (json.recipients.length > 0) {
          setSelectedUserId(json.recipients[0].userId)
        }
      } else {
        setError(json.error ?? 'Failed to fetch recipients')
      }
    } catch (e: any) {
      setError(e.message ?? 'Network error')
    } finally {
      setLoadingRecipients(false)
    }
  }

  const handleForward = async () => {
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
          justification: comments,
          destinationPayload: selectedUserId ? { target_user_id: String(selectedUserId) } : undefined,
        }),
      })

      const json = await res.json()
      if (json.ok) {
        onOpenChange(false)
        if (onSuccess) onSuccess()
      } else {
        setError(json.reason ?? json.error ?? 'Transition blocked by workflow engine')
      }
    } catch (e: any) {
      setError(e.message ?? 'Failed to execute forward transition')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            {actionLabel}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 text-xs bg-destructive/10 border border-destructive/30 rounded-md text-destructive flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Select Recipient / Office</Label>
            {loadingRecipients ? (
              <div className="p-3 border rounded-md flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                Loading authorized recipients...
              </div>
            ) : recipients.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                Default role assignment ({targetRole.toUpperCase()}) will be assigned.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-[160px] overflow-y-auto border rounded-md p-2">
                {recipients.map((r) => (
                  <div
                    key={r.userId}
                    onClick={() => setSelectedUserId(r.userId)}
                    className={`flex items-center justify-between p-2 rounded-md cursor-pointer text-xs transition-colors ${
                      selectedUserId === r.userId
                        ? 'bg-primary/10 border border-primary/40 font-medium'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-foreground">{r.name}</div>
                      <div className="text-muted-foreground">
                        {r.designation ?? r.role} {r.area_cd ? `(${r.area_cd})` : ''}
                      </div>
                    </div>
                    {selectedUserId === r.userId && (
                      <UserCheck className="w-4 h-4 text-primary shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="comments" className="text-sm font-medium">
              Justification & Routing Remarks
            </Label>
            <Textarea
              id="comments"
              placeholder="Enter instructions, notes, or justification for forwarding..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
              className="text-xs"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleForward} disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
            Confirm Forward
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
