'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { SectionCard } from '@/shared/components/coalrr'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { CheckCircle2, FileWarning, Loader2, Download, Eye } from 'lucide-react'
import { useAppTranslation } from '@/localization/hooks/useAppTranslation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import { formatNumber } from '@/lib/utils/formatters'

interface FormXXIIApproval {
  proposal_id: string
  schedule_code: string
  proposal_title: string | null
  state: string
  instance_id: string | null
  instance_status: string | null
  file: {
    file_id: string
    original_name: string
    attached_at: string
    attached_by: string | null
    mime_type: string | null
    size_bytes: string | null
  } | null
}

export function ProjectBoardApprovals({ projectId }: { projectId: string }) {
  const t = useAppTranslation('project_master')
  const [selectedApproval, setSelectedApproval] = React.useState<FormXXIIApproval | null>(null)

  const { data, isLoading } = useQuery<{ approvals: FormXXIIApproval[] }>({
    queryKey: ['project-form-xxii', projectId],
    queryFn: async () => {
      const r = await fetch(`/api/projects/${projectId}/form-xxii`)
      if (!r.ok) throw new Error(t('project_master.form_xxii_error', 'Failed to load Form-XXII approvals'))
      const json = await r.json()
      return json.data ?? json
    },
    enabled: !!projectId,
  })

  const approvals = data?.approvals ?? []

  if (!isLoading && approvals.length === 0) return null

  return (
    <>
      <SectionCard
        title={t('project_master.form_xxii_title', 'Board Deviation Approvals (Form-XXII)')}
        icon={FileWarning}
        description={t('project_master.form_xxii_desc', 'Proposals that exceeded project limits and received formal Board approval')}
      >
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <Loader2 className="h-4 w-4 animate-spin" /> {t('common.loading_approvals', 'Loading approvals…')}
          </div>
        ) : (
          <ul className="space-y-3">
            {approvals.map((a) => (
              <li
                key={a.proposal_id}
                className="flex flex-col gap-2 rounded-lg border bg-card p-3 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span className="font-mono text-xs font-semibold text-emerald-700">{a.schedule_code}</span>
                    <Badge variant="outline" className="text-[10px] bg-background">
                      {a.state}
                    </Badge>
                  </div>
                  {a.proposal_title && (
                    <p className="text-sm text-foreground truncate">{a.proposal_title}</p>
                  )}
                  {a.file && (
                    <p className="text-[11px] text-muted-foreground">
                      {t('common.uploaded', 'Uploaded')} {new Date(a.file.attached_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      {a.file.size_bytes && (
                        <> · {(Number(a.file.size_bytes) / 1024).toFixed(1)} KB</>
                      )}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 bg-background"
                    onClick={() => setSelectedApproval(a)}
                  >
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    Details
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <Dialog open={!!selectedApproval} onOpenChange={(open) => !open && setSelectedApproval(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Form-XXII Approval Details</DialogTitle>
            <DialogDescription>
              Details of the Board Deviation Approval for {selectedApproval?.schedule_code}
            </DialogDescription>
          </DialogHeader>
          
          {selectedApproval && (
            <div className="space-y-4 py-4 text-sm">
              <div className="grid grid-cols-3 gap-2 border-b pb-2">
                <div className="font-semibold text-muted-foreground">Proposal ID</div>
                <div className="col-span-2 font-mono">{selectedApproval.proposal_id}</div>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b pb-2">
                <div className="font-semibold text-muted-foreground">Title</div>
                <div className="col-span-2">{selectedApproval.proposal_title || 'N/A'}</div>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b pb-2">
                <div className="font-semibold text-muted-foreground">Current State</div>
                <div className="col-span-2">
                  <Badge variant="outline">{selectedApproval.state}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b pb-2">
                <div className="font-semibold text-muted-foreground">Workflow Instance</div>
                <div className="col-span-2 font-mono">
                  {selectedApproval.instance_id || 'N/A'} 
                  {selectedApproval.instance_status && ` (${selectedApproval.instance_status})`}
                </div>
              </div>
              
              {selectedApproval.file ? (
                <div className="rounded-lg border bg-muted/50 p-3 mt-4">
                  <div className="font-semibold text-sm mb-2">Attached Document</div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm truncate mr-4">
                      {selectedApproval.file.original_name}
                      <span className="text-xs text-muted-foreground block">
                         {(Number(selectedApproval.file.size_bytes) / 1024).toFixed(1)} KB • {selectedApproval.file.mime_type}
                      </span>
                    </div>
                    <Button variant="default" size="sm" asChild>
                      <a href={`/api/files/${selectedApproval.file.file_id}/download`} target="_blank" rel="noreferrer">
                        <Download className="mr-1.5 h-3.5 w-3.5" /> Download
                      </a>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic">
                  No approval document attached to this proposal.
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedApproval(null)}>Close</Button>
            {selectedApproval && (
              <Button asChild>
                <a href={`/proposals?schedule_id=${selectedApproval.proposal_id}`}>
                  View Proposal WorkSpace
                </a>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ProjectBoardApprovals
