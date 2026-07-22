'use client'

import * as React from 'react'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { AlertTriangle, Loader2, FileWarning, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { DatePicker } from '@/components/ui/date-picker'
import { useAppTranslation } from '@/localization/hooks/useAppTranslation'
import { DocumentUploader } from '@/components/coalrr'
import type { UploadedDoc } from '@/components/coalrr'
import { DocumentWorkspaceModal } from '@/modules/document-engine/presentation/components/DocumentWorkspaceModal'

interface ProjectData {
  id: string
  name: string
  total_land_limit_acres: string | number
  total_budget_ceiling: string | number
  total_employment_quota: number
  mouza_lgds?: string[]
}

export function FormXXIIModal({
  open, onOpenChange, project,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  project: ProjectData
}) {
  const qc = useQueryClient()
  const t = useAppTranslation('project_master')
  
  // Step 1: Proposal Input
  const [proposedArea, setProposedArea] = React.useState<string>('')
  const [proposedJobs, setProposedJobs] = React.useState<string>('')

  // Step 2: Draft Data
  const [draftData, setDraftData] = React.useState<any>(null)
  
  // Step 3: Approval Input
  const [approvalDate, setApprovalDate] = React.useState<string>('')
  const [approvalRefNo, setApprovalRefNo] = React.useState<string>('')
  const [doc, setDoc] = React.useState<UploadedDoc | null>(null)

  // Step 3a: Statutory Clearance Statuses (Form-XXII Points 3, 4, 5)
  const [dgmsStatus, setDgmsStatus] = React.useState<string>('')
  const [envStatus, setEnvStatus] = React.useState<string>('')
  const [forestStatus, setForestStatus] = React.useState<string>('')
  
  const [isWorkspaceOpen, setIsWorkspaceOpen] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setProposedArea('')
      setProposedJobs('')
      setDraftData(null)
      setApprovalDate('')
      setApprovalRefNo('')
      setDoc(null)
      setDgmsStatus('')
      setEnvStatus('')
      setForestStatus('')
    }
  }, [open])

  const draftMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        proposedAreaAcres: proposedArea,
        proposedJobs: Number(proposedJobs) || 0
      }
      
      const r = await fetch(`/api/projects/${project.id}/form-xxii/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await r.json()
      if (!r.ok) throw new Error(json?.error ?? 'Failed to generate draft')
      return json.data
    },
    onSuccess: (data) => {
      setDraftData(data)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const approveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        approvedAreaAcres: draftData.proposedArea,
        approvedJobs: Number(proposedJobs) || 0,
        approvalDate,
        approvalRefNo,
        docId: doc?.id,
        mouzaLgds: project.mouza_lgds,
        clearanceStatuses: {
          dgms: dgmsStatus,
          env: envStatus,
          forest: forestStatus
        }
      }
      
      const r = await fetch(`/api/projects/${project.id}/form-xxii/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await r.json()
      if (!r.ok) throw new Error(json?.error ?? 'Failed to approve Form-XXII')
      return json
    },
    onSuccess: () => {
      toast.success('Form-XXII deviation approved successfully.')
      qc.invalidateQueries({ queryKey: ['projects'] })
      qc.invalidateQueries({ queryKey: ['project-form-xxii', project.id] })
      onOpenChange(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <DialogHeader>
          <DialogTitle>Form-XXII Deviation Request</DialogTitle>
          <DialogDescription>
            Simulate a proposal request to check if a Form-XXII is required, and approve the deviation if breached.
          </DialogDescription>
        </DialogHeader>

        {!draftData ? (
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Proposed Additional Area (Acres)</Label>
                <Input
                  type="number"
                  value={proposedArea}
                  onChange={(e) => setProposedArea(e.target.value)}
                  placeholder="e.g. 50"
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Proposed Additional Jobs</Label>
                <Input
                  type="number"
                  value={proposedJobs}
                  onChange={(e) => setProposedJobs(e.target.value)}
                  placeholder="e.g. 10"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={draftMutation.isPending}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                onClick={() => draftMutation.mutate()}
                disabled={!proposedArea || draftMutation.isPending}
              >
                {draftMutation.isPending
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking…</>
                  : 'Check Compliance'}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="grid gap-4 py-2">
            {draftData.isBaselineBreached ? (
              <Alert variant="destructive" className="border-destructive/50 bg-destructive/10 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Baseline Breached</AlertTitle>
                <AlertDescription>
                  This proposal exceeds the locked baseline by <strong>{draftData.draftDeviationData.deviationArea} acres</strong>. 
                  A Form-XXII board approval is required to proceed.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-emerald-500/50 bg-emerald-500/10 text-emerald-700">
                <CheckCircle2 className="h-4 w-4" color="currentColor" />
                <AlertTitle>Within Baseline</AlertTitle>
                <AlertDescription>
                  This proposal can be accommodated within the current approved baseline. No Form-XXII is required.
                </AlertDescription>
              </Alert>
            )}

            {draftData.isBaselineBreached && (
              <>
                <div className="grid gap-1.5 mt-2 mb-4">
                  <div className="flex items-center justify-between">
                    <Label>Form-XXII Draft Generation</Label>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                    onClick={() => setIsWorkspaceOpen(true)}
                  >
                    <FileWarning className="mr-2 h-4 w-4" />
                    Generate Form-XXII (DOCX)
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    Generate and download the Form-XXII document to get it signed by the board.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2 border-t pt-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="approval-date">Board Approval Date *</Label>
                    <DatePicker
                      value={approvalDate}
                      onChange={(d) => setApprovalDate(d ? format(d, 'yyyy-MM-dd') : '')}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="approval-ref">Board Ref / File No *</Label>
                    <Input
                      id="approval-ref"
                      value={approvalRefNo}
                      onChange={(e) => setApprovalRefNo(e.target.value)}
                      placeholder="e.g. CIL/BOARD/2026/02"
                    />
                  </div>
                </div>

                <div className="grid gap-3 mt-4 border-t pt-4">
                  <h4 className="text-sm font-semibold text-muted-foreground">Statutory Clearance Status (Required for Form-XXII)</h4>
                  <div className="grid gap-1.5">
                    <Label>DGMS Clearance Status</Label>
                    <Select value={dgmsStatus} onValueChange={setDgmsStatus}>
                      <SelectTrigger><SelectValue placeholder="Select status..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Obtained">Obtained</SelectItem>
                        <SelectItem value="Pending">Pending / Applied</SelectItem>
                        <SelectItem value="Not Applicable">Not Applicable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Environment Clearance Status</Label>
                    <Select value={envStatus} onValueChange={setEnvStatus}>
                      <SelectTrigger><SelectValue placeholder="Select status..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Obtained">Obtained</SelectItem>
                        <SelectItem value="Pending">Pending / Applied</SelectItem>
                        <SelectItem value="Not Applicable">Not Applicable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Forest Clearance Status</Label>
                    <Select value={forestStatus} onValueChange={setForestStatus}>
                      <SelectTrigger><SelectValue placeholder="Select status..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Obtained">Obtained</SelectItem>
                        <SelectItem value="Pending">Pending / Applied</SelectItem>
                        <SelectItem value="Not Applicable">Not Applicable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>


                <div className="grid gap-1.5 mt-4 border-t pt-4">
                  <Label>Form-XXII Approved Document *</Label>
                  <DocumentUploader
                    checklist_item_key="FORM_XXII_DOC"
                    mode="single"
                    documents={doc ? [doc] : []}
                    onChange={(docs) => setDoc(Array.isArray(docs) ? docs[0] : docs)}
                    onRemove={() => setDoc(null)}
                    entity_type="mst_project"
                    entity_id={project.id}
                    module="project-master"
                  />
                </div>
              </>
            )}

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setDraftData(null)} disabled={approveMutation.isPending}>
                Back
              </Button>
              {draftData.isBaselineBreached && (
                <Button
                  onClick={() => approveMutation.mutate()}
                  disabled={!approvalDate || !approvalRefNo || !doc || approveMutation.isPending}
                  variant="default"
                >
                  {approveMutation.isPending
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Approving…</>
                    : <><FileWarning className="mr-2 h-4 w-4" /> Approve Form-XXII</>}
                </Button>
              )}
            </DialogFooter>
          </div>
        )}
      </DialogContent>
      {draftData?.isBaselineBreached && (
        <DocumentWorkspaceModal 
          isOpen={isWorkspaceOpen} 
          onOpenChange={setIsWorkspaceOpen} 
          templateCode="FORM_XXII" 
          businessId={project.id} 
        />
      )}
    </Dialog>
  )
}
