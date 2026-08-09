'use client'

import * as React from 'react'
import { AlertCircle, CheckCircle2, Clock, ArrowRight, ShieldAlert, FileSignature, Check } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { ACQ_LAND_SCHEDULE, MODULE_CODES } from '@/core/config/module-codes.config'

export interface ProposalActionCenterBannerProps {
  proposalId: string
  proposalNo: string
  currentStage: string
  userRole?: string
  checklistSummary?: {
    total: number
    completed: number
    isComplete: boolean
  }
  nextTransitionLabel?: string
  pendingSignatureForm?: string
  onExecuteAction?: () => void
  onOpenDocumentWorkspace?: (templateCode: string) => void
}

export function ProposalActionCenterBanner({
  proposalId,
  proposalNo,
  currentStage,
  userRole = 'user',
  checklistSummary,
  nextTransitionLabel,
  pendingSignatureForm,
  onExecuteAction,
  onOpenDocumentWorkspace,
}: ProposalActionCenterBannerProps) {
  // Determine primary action required by the logged-in user
  let actionTitle = 'Review & Verify Proposal'
  let actionDescription = 'Proposal is awaiting review in current stage.'
  let actionCta = 'Review Details'
  let actionIcon = <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
  let isActionUrgent = false

  if (pendingSignatureForm) {
    actionTitle = `Digital Signature Required: ${pendingSignatureForm}`
    actionDescription = `Your official sign-off as ${userRole} is pending on ${pendingSignatureForm}.`
    actionCta = `Sign ${pendingSignatureForm} Now`
    actionIcon = <FileSignature className="h-4 w-4 text-rose-600 dark:text-rose-400" />
    isActionUrgent = true
  } else if (checklistSummary && !checklistSummary.isComplete) {
    const missing = checklistSummary.total - checklistSummary.completed
    actionTitle = `Complete Compliance Checklist (${missing} Mandatory Pending)`
    actionDescription = `${checklistSummary.completed} of ${checklistSummary.total} items completed. Mandatory checklist clearance required.`
    actionCta = 'Complete Checklist'
    actionIcon = <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
  } else if (nextTransitionLabel) {
    actionTitle = `Ready for State Forwarding: ${nextTransitionLabel}`
    actionDescription = 'All mandatory requirements satisfied. Proposal is ready to move to next approval stage.'
    actionCta = nextTransitionLabel
    actionIcon = <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
  }

  const handleCtaClick = () => {
    if (pendingSignatureForm && onOpenDocumentWorkspace) {
      onOpenDocumentWorkspace(pendingSignatureForm)
    } else if (onExecuteAction) {
      onExecuteAction()
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between border-b pb-3 mb-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs font-bold text-amber-700 bg-amber-50 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400">
            {proposalNo}
          </Badge>
          <span className="text-xs font-semibold text-foreground">Proposal Action Command Center</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span>Active Role Scope:</span>
          <Badge variant="secondary" className="text-[10px] font-mono capitalize">
            {userRole.replace(/_/g, ' ')}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Action Required by You */}
        <div className={`rounded-md border p-3 flex flex-col justify-between transition ${
          isActionUrgent 
            ? 'border-rose-200 bg-rose-50/50 dark:bg-rose-950/20 dark:border-rose-900/50' 
            : 'border-amber-200 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-900/40'
        }`}>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 dark:text-rose-400">
              {actionIcon}
              <span>Action Required by You</span>
            </div>
            <div className="text-xs font-semibold text-foreground">{actionTitle}</div>
            <div className="text-[11px] text-muted-foreground leading-tight">{actionDescription}</div>
          </div>
          <Button 
            size="sm" 
            onClick={handleCtaClick} 
            className={`mt-3 w-full text-xs font-semibold ${
              isActionUrgent ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
          >
            {actionCta} <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>

        {/* Card 2: Completed Items (Done) */}
        <div className="rounded-md border border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-900/40 p-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Completed Items (Done)</span>
            </div>
            <div className="space-y-1 text-xs text-foreground">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Checklist Items:</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  {checklistSummary ? `${checklistSummary.completed} / ${checklistSummary.total}` : 'Verified'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Master Module:</span>
                <span className="font-mono text-[10px] font-bold">{MODULE_CODES.LAND_SCHEDULE}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Entity Type:</span>
                <span className="font-mono text-[10px] font-bold">{ACQ_LAND_SCHEDULE}</span>
              </div>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
            <Check className="h-3 w-3" /> Requirements checked against DB rules
          </div>
        </div>

        {/* Card 3: Pending in Workflow */}
        <div className="rounded-md border border-sky-200 bg-sky-50/40 dark:bg-sky-950/20 dark:border-sky-900/40 p-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-800 dark:text-sky-400">
              <Clock className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              <span>Pending in Workflow</span>
            </div>
            <div className="space-y-1 text-xs text-foreground">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Current Stage:</span>
                <Badge variant="outline" className="text-[10px] font-semibold bg-background">
                  {currentStage}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-semibold text-sky-700 dark:text-sky-400">In Progress</span>
              </div>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">
            Audit history & timeline feed active.
          </div>
        </div>
      </div>
    </div>
  )
}
