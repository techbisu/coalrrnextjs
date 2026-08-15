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
  AlertCircle,
  Building2,
  FileText,
  Upload,
  Send,
  ArrowLeftRight,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  Lightbulb,
  Plus,
  Trash2,
} from 'lucide-react'
import { AreaSelect, MineSelect, UserSelect } from '@/shared/components/coalrr/selects'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

export interface EnhancedTransitionPayload {
  name: string
  label?: string
  fromState?: string
  toState?: string
  to?: string
  role?: string
  routingType?: string
  guards?: {
    canExecute: boolean
    blockingReasons?: Array<{ code: string; label: string; targetType?: string; targetCode?: string }>
  }
  destination?: {
    state: string
    label?: string
    targetRole?: string
  }
  recipient?: {
    required: boolean
    selectionType?: 'AREA' | 'MINE' | 'CASCADE_AREA_MINE_UNIT' | 'USER' | null
    allowedAreaCds?: string[]
    allowedMineCds?: string[]
  }
  reason?: {
    required: boolean
  }
  supportingDocument?: {
    allowed: boolean
    required: boolean
  }
  recommendations?: {
    allowed?: boolean
    applicableItems?: Array<{ targetType: string; targetCode: string; label: string; isMandatory?: boolean }>
  }
}

export interface WorkflowActionCommandCenterProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  proposalId: string
  transition: EnhancedTransitionPayload | null
  onCompleted?: () => void
}

export function WorkflowActionCommandCenter({
  open,
  onOpenChange,
  proposalId,
  transition,
  onCompleted,
}: WorkflowActionCommandCenterProps) {
  const queryClient = useQueryClient()
  const [areaCd, setAreaCd] = React.useState<string | undefined>()
  const [mineCd, setMineCd] = React.useState<string | undefined>()
  const [targetUserId, setTargetUserId] = React.useState<string | undefined>()
  const [comments, setComments] = React.useState('')
  const [file, setFile] = React.useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [recommendations, setRecommendations] = React.useState<
    Array<{
      targetType: 'MILESTONE' | 'CHECKLIST' | 'DOCUMENT_SIGNATURE' | 'WORKFLOW_ACTION'
      targetCode: string
      mode: 'RECOMMENDED' | 'REQUIRED'
      reason?: string
    }>
  >([])

  // Reset local state whenever dialog opens
  React.useEffect(() => {
    if (open) {
      setAreaCd(undefined)
      setMineCd(undefined)
      setTargetUserId(undefined)
      setComments('')
      setFile(null)
      setError(null)
      setIsSubmitting(false)
      setRecommendations([])
    }
  }, [open, transition])

  if (!transition) return null

  const isReturn = transition.reason?.required ?? (transition.name.toLowerCase().includes('return') || transition.name.toLowerCase().includes('reject'))
  const isRecipientRequired = transition.recipient?.required ?? false
  const canExecute = transition.guards?.canExecute ?? true
  const blockingReasons = transition.guards?.blockingReasons || []

  // Cascading reset handlers for strict state hygiene
  const handleAreaChange = (val: string | string[]) => {
    const selectedArea = typeof val === 'string' ? val : (Array.isArray(val) ? val[0] : undefined)
    setAreaCd(selectedArea)
    setMineCd(undefined)
    setTargetUserId(undefined)
  }

  const handleMineChange = (val: string | string[]) => {
    const selectedMine = typeof val === 'string' ? val : (Array.isArray(val) ? val[0] : undefined)
    setMineCd(selectedMine)
    setTargetUserId(undefined)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!canExecute) {
      setError('Cannot execute transition while compliance guards are blocked.')
      return
    }

    if (isReturn && !comments.trim()) {
      setError('Justification note is required when returning a proposal.')
      return
    }

    if (isRecipientRequired && !areaCd && !mineCd) {
      setError('Please select a target destination (Area / Mine Office) before submitting.')
      return
    }

    if (transition.supportingDocument?.required && !file) {
      setError('Supporting document attachment is mandatory for this transition.')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const res = await fetch(`/api/proposals/${proposalId}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transition: transition.name,
          role: transition.role || 'unit_office',
          comments,
          area_cd: areaCd,
          mine_cd: mineCd,
          target_user_id: targetUserId,
          recommendations: recommendations.length > 0 ? recommendations : undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Workflow transition failed')
      }

      toast.success(data.message || `Proposal transitioned to ${data.newState}`)
      queryClient.invalidateQueries({ queryKey: ['proposals', proposalId] })
      queryClient.invalidateQueries({ queryKey: ['workflow-snapshot'] })
      queryClient.invalidateQueries({ queryKey: ['checklist'] })

      onOpenChange(false)
      onCompleted?.()
    } catch (err: any) {
      setError(err.message || 'Failed to submit workflow action')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !isSubmitting && onOpenChange(val)}>
      <DialogContent className="max-w-lg sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Badge variant={isReturn ? 'destructive' : 'default'} className="text-xs px-2.5 py-0.5">
                {isReturn ? 'Return Back Action' : 'Forward / Advance Action'}
              </Badge>
              {transition.routingType && (
                <Badge variant="outline" className="text-[10px] text-muted-foreground uppercase font-mono">
                  {transition.routingType}
                </Badge>
              )}
            </div>
            <DialogTitle className="text-lg font-semibold flex items-center gap-2 mt-1">
              <ArrowLeftRight className="h-5 w-5 text-primary" />
              {transition.label || transition.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Transitioning proposal from{' '}
              <span className="font-semibold text-foreground">{transition.fromState || 'Current State'}</span> to{' '}
              <span className="font-semibold text-foreground">{transition.destination?.state || transition.toState || transition.to}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Blocking Reasons Alert Banner */}
            {!canExecute && blockingReasons.length > 0 && (
              <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-800 dark:bg-rose-950/40 dark:text-rose-200 border border-rose-200 dark:border-rose-900 space-y-1">
                <div className="flex items-center gap-2 font-semibold text-rose-900 dark:text-rose-100">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>Workflow Transition Blocked by Prerequisites</span>
                </div>
                <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                  {blockingReasons.map((b, i) => (
                    <li key={i}>{b.label}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200 border border-amber-200 dark:border-amber-900">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Scope-Aware Cascading Destination Selector */}
            {isRecipientRequired && (
              <div className="space-y-3 p-3 rounded-lg bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                <Label className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-primary" />
                  Target Recipient Destination <span className="text-rose-500">*</span>
                </Label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[11px] text-muted-foreground block mb-1">Area Office</Label>
                    <AreaSelect
                      value={areaCd}
                      onChange={handleAreaChange}
                      placeholder="Select Target Area..."
                      className="bg-white dark:bg-slate-950 text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px] text-muted-foreground block mb-1">Mine / Colliery Office</Label>
                    <MineSelect
                      areaCd={areaCd}
                      value={mineCd}
                      onChange={handleMineChange}
                      disabled={!areaCd}
                      placeholder="Select Target Mine..."
                      className="bg-white dark:bg-slate-950 text-xs"
                    />
                  </div>
                </div>

                {transition.recipient?.selectionType === 'USER' && (
                  <div>
                    <Label className="text-[11px] text-muted-foreground block mb-1">Assigned Official / User</Label>
                    <UserSelect
                      areaCd={areaCd}
                      mineCd={mineCd}
                      value={targetUserId}
                      onChange={(val) => setTargetUserId(typeof val === 'string' ? val : (Array.isArray(val) ? val[0] : undefined))}
                      placeholder="Select Target Official..."
                      className="bg-white dark:bg-slate-950 text-xs"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Justification & Review Remarks */}
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
                className="min-h-[90px] text-xs resize-y"
              />
            </div>

            {/* Optional / Mandatory Supporting Document Attachment */}
            {transition.supportingDocument?.allowed !== false && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1">
                  <Upload className="h-3.5 w-3.5 text-muted-foreground" />
                  Supporting Document {transition.supportingDocument?.required ? <span className="text-rose-500">*</span> : '(Optional)'}
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
                      <Upload className="h-4 w-4 text-muted-foreground" />
                      <span>Click or drag file to attach (PDF, DOCX, Verification Copies)</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              variant={isReturn ? 'destructive' : 'default'}
              disabled={isSubmitting || !canExecute}
              className={`gap-1.5 text-xs font-medium ${
                isReturn ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
              } text-white`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {isReturn ? <ArrowLeftRight className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  Confirm &amp; Execute
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
