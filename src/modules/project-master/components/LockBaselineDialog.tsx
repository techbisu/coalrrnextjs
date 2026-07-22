'use client'

import * as React from 'react'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { AlertTriangle, CheckCircle2, Loader2, Lock } from 'lucide-react'
import { useAppTranslation } from '@/localization/hooks/useAppTranslation'
import { DocumentUploader } from '@/components/coalrr'
import type { UploadedDoc } from '@/components/coalrr'

interface ProjectData {
  id: string
  name: string
  total_land_limit_acres: string | number
  total_budget_ceiling: string | number
  total_employment_quota: number
  mouza_lgds?: string[]
}

export function LockBaselineDialog({
  open, onOpenChange, project,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  project: ProjectData
}) {
  const qc = useQueryClient()
  const t = useAppTranslation('project_master')
  
  const [typedName, setTypedName] = React.useState('')
  const [approvalDate, setApprovalDate] = React.useState<string>('')
  const [approvalRefNo, setApprovalRefNo] = React.useState<string>('')
  const [doc, setDoc] = React.useState<UploadedDoc | null>(null)

  React.useEffect(() => {
    if (open) {
      setTypedName('')
      setApprovalDate('')
      setApprovalRefNo('')
      setDoc(null)
    }
  }, [open])

  const nameMatches = typedName.trim() === project.name
  const isFormValid = nameMatches && approvalDate && approvalRefNo && doc

  const lockMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        confirmName: typedName.trim(),
        approvedAreaAcres: project.total_land_limit_acres,
        approvedBudgetINR: project.total_budget_ceiling,
        approvedJobs: project.total_employment_quota,
        approvalDate,
        approvalRefNo,
        docId: doc ? doc.id : undefined,
        mouzaLgds: project.mouza_lgds
      }
      
      const r = await fetch(`/api/projects/${project.id}/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await r.json()
      if (!r.ok) throw new Error(json?.error ?? t('project_master.lock_error', 'Failed to lock baseline'))
      return json
    },
    onSuccess: () => {
      toast.success(t('project_master.lock_success', { defaultValue: 'Baseline LOCKED for "{{name}}".', name: project.name }))
      qc.invalidateQueries({ queryKey: ['projects'] })
      onOpenChange(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('project_master.lock_baseline_title', 'Lock Baseline')}</DialogTitle>
          <DialogDescription>
            {t('project_master.lock_baseline_desc', 'This action is irreversible. Once locked, the project baseline (land limit, budget ceiling, employment quota) becomes immutable and downstream modules bind to it.')}
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive" className="border-destructive/50 bg-destructive/10 text-destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('project_master.irreversible_op', 'Irreversible operation')}</AlertTitle>
          <AlertDescription>
            {t('project_master.lock_confirm_prompt', 'You are about to lock the baseline for ')}
            <span className="font-semibold">{project.name}</span>. 
            {t('project_master.lock_type_confirm', 'Type the project name exactly as shown below to confirm.')}
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="lock-confirm" className="text-destructive font-semibold">{t('project_master.type_name_to_confirm', 'Confirm Project Name *')}</Label>
            <Input
              id="lock-confirm"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder={project.name}
              className="font-mono border-destructive/50"
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              {nameMatches
                ? <span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle2 className="h-3 w-3" /> {t('project_master.name_matches', 'Name matches.')}</span>
                : <>{t('project_master.expected', 'Expected:')} <span className="font-mono font-medium">{project.name}</span></>}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="approval-date">Approval Date *</Label>
              <DatePicker
                value={approvalDate}
                onChange={(date) => setApprovalDate(date ? format(date, 'yyyy-MM-dd') : '')}
                placeholder="Select approval date"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="approval-ref">Board Ref / File No *</Label>
              <Input
                id="approval-ref"
                value={approvalRefNo}
                onChange={(e) => setApprovalRefNo(e.target.value)}
                placeholder="e.g. CIL/BOARD/2026/01"
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Initial Baseline Approval Document (Form-I / Board Resolution) *</Label>
            <DocumentUploader
              checklist_item_key="INITIAL_BASELINE_DOC"
              mode="single"
              documents={doc ? [doc] : []}
              onChange={(docs) => setDoc(Array.isArray(docs) ? docs[0] : docs)}
              onRemove={() => setDoc(null)}
              entity_type="mst_project"
              entity_id={project.id}
              module="project-master"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={lockMutation.isPending}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={() => lockMutation.mutate()}
            disabled={!isFormValid || lockMutation.isPending}
            variant="destructive"
          >
            {lockMutation.isPending
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('common.locking', 'Locking…')}</>
              : <><Lock className="mr-2 h-4 w-4" /> {t('project_master.lock_baseline_btn', 'Lock Baseline')}</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
