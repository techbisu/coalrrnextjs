'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { Badge } from '@/shared/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { AlertCircle, FileText, Upload, Send, ArrowLeftRight, CheckCircle2, Building2 } from 'lucide-react'
import { MineSelect } from './selects/MineSelect'

export interface ActionJustificationDialogProps {
  isOpen: boolean
  onClose: () => void
  actionName: string
  actionLabel: string
  isReturn?: boolean
  requiresTargetRecipient?: boolean
  recipientOptions?: Array<{ label: string; value: string }>
  onSubmit: (data: { comments: string; targetRecipient?: string; targetRecipientId?: string | null; file?: File | null }) => Promise<void>
}

export function ActionJustificationDialog({
  isOpen,
  onClose,
  actionName,
  actionLabel,
  isReturn = false,
  requiresTargetRecipient = false,
  recipientOptions = [],
  onSubmit,
}: ActionJustificationDialogProps) {
  const [comments, setComments] = React.useState('')
  const [targetRecipient, setTargetRecipient] = React.useState('')
  const [targetRecipientId, setTargetRecipientId] = React.useState<string | null>(null)
  const [file, setFile] = React.useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [minesList, setMinesList] = React.useState<Array<{ label: string; value: string }>>([])

  // Automatically detect if action requires target recipient (e.g. cross colliery / unit forwarding)
  const isCrossCollieryAction =
    requiresTargetRecipient ||
    actionName.includes('cross') ||
    actionName.includes('unit') ||
    actionName.includes('reconcil') ||
    actionLabel.toLowerCase().includes('unit') ||
    actionLabel.toLowerCase().includes('cross')

  React.useEffect(() => {
    if (isOpen) {
      setComments('')
      setTargetRecipient('')
      setTargetRecipientId(null)
      setFile(null)
      setError(null)
      setIsSubmitting(false)

    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isReturn && !comments.trim()) {
      setError('Justification note is required when returning a proposal for revision.')
      return
    }

    if (isCrossCollieryAction && !targetRecipient.trim()) {
      setError('Please select the Target Recipient / Adjacent Colliery Office before submitting.')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      await onSubmit({
        comments,
        targetRecipient,
        targetRecipientId,
        file,
      })
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to submit action')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="max-w-lg sm:max-w-xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Badge variant={isReturn ? 'destructive' : 'default'} className="text-xs px-2.5 py-0.5">
                {isReturn ? 'Return Back Action' : 'Forward Action'}
              </Badge>
            </div>
            <DialogTitle className="text-lg font-semibold flex items-center gap-2 mt-1">
              <ArrowLeftRight className="h-5 w-5 text-primary" />
              {actionLabel}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {isCrossCollieryAction
                ? 'Select the target adjacent colliery / mine unit office and add optional review remarks.'
                : isReturn
                ? 'Provide a mandatory justification note detailing revision reasons and optionally attach supporting documents.'
                : 'Add an optional justification note and supporting documentation for this workflow step.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Target Recipient Dropdown (for Cross-Colliery & Unit Actions) */}
            {isCrossCollieryAction && (
              <div className="space-y-1.5 p-3 rounded-lg bg-blue-50/50 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-900">
                <Label className="text-xs font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  Target Adjacent Colliery / Mine Unit Office <span className="text-rose-500">*</span>
                </Label>
                <MineSelect
                  ignoreScope
                  value={targetRecipientId || undefined}
                  onChange={(val, option) => {
                    const optObj = Array.isArray(option) ? option[0] : option
                    const selectedText = optObj?.label || (typeof val === 'string' ? val : (Array.isArray(val) ? val[0] : ''))
                    setTargetRecipient(selectedText)
                    setTargetRecipientId(typeof val === 'string' ? val : (Array.isArray(val) ? val[0] : null))
                  }}
                  placeholder="Select Target Mine / Unit Office from DB..."
                  className="bg-white dark:bg-slate-900 border-blue-300 text-xs"
                />
                <p className="text-[11px] text-blue-700 dark:text-blue-300">
                  Proposal will be routed to the selected unit for Form-VII joint boundary verification.
                </p>
              </div>
            )}

            {/* Justification Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1">
                Justification / Review Remarks {isReturn && <span className="text-rose-500">*</span>}
              </Label>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder={
                  isReturn
                    ? 'State the specific discrepancies, missing items, or required revisions...'
                    : 'Add optional review remarks or approval notes...'
                }
                className="min-h-[100px] text-xs resize-y"
              />
            </div>

            {/* Optional Supporting Document Uploader */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1">
                <Upload className="h-3.5 w-3.5 text-muted-foreground" />
                Supporting Document (Optional)
              </Label>
              <div className="relative rounded-md border border-dashed border-border bg-muted/20 p-3 text-center transition-colors hover:bg-muted/40">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                {file ? (
                  <div className="flex items-center justify-between text-xs text-foreground">
                    <span className="flex items-center gap-2 truncate font-medium">
                      <FileText className="h-4 w-4 text-primary" />
                      {file.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span>Click or drag file to attach (PDF, DOCX, Scan copies)</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              variant={isReturn ? 'destructive' : 'default'}
              disabled={isSubmitting}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSubmitting ? (
                'Processing...'
              ) : (
                <>
                  {isReturn ? <ArrowLeftRight className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  Confirm &amp; Submit
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
