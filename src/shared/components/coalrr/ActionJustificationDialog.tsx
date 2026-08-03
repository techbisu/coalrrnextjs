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
import { AlertCircle, FileText, Upload, Send, ArrowLeftRight, CheckCircle2 } from 'lucide-react'

export interface ActionJustificationDialogProps {
  isOpen: boolean
  onClose: () => void
  actionName: string
  actionLabel: string
  isReturn?: boolean
  onSubmit: (data: { comments: string; file: File | null }) => Promise<void>
}

export function ActionJustificationDialog({
  isOpen,
  onClose,
  actionName,
  actionLabel,
  isReturn = false,
  onSubmit,
}: ActionJustificationDialogProps) {
  const [comments, setComments] = React.useState('')
  const [file, setFile] = React.useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (isOpen) {
      setComments('')
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

    try {
      setIsSubmitting(true)
      setError(null)
      await onSubmit({ comments, file })
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
              {isReturn
                ? 'Provide a mandatory justification note detailing the revision reasons and optionally attach supporting documents.'
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
              className="gap-1.5"
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
