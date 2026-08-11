'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, AlertCircle, Layers } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Alert, AlertTitle, AlertDescription } from '@/shared/components/ui/alert'
import { Badge } from '@/shared/components/ui/badge'
import { CollapsibleSectionCard } from '@/shared/components/coalrr'
import { DocumentWorkspaceModal } from '@/shared/components/coalrr/DocumentWorkspaceModal'
import { ScheduleDetail } from '../types'
import { AcquisitionDetailTabs } from './AcquisitionDetailTabs'
import { ProposalHeaderBar } from './sections/ProposalHeaderBar'

export function AcquisitionDetail({ schedule }: { schedule: ScheduleDetail }) {
  const router = useRouter()
  const [formXXIIStatus, setFormXXIIStatus] = useState<{
    exists: boolean
    status?: string
    instance_id?: string
    file?: {
      file_id: string
      original_name: string
      attached_at: string
      attached_by: string | null
      mime_type: string | null
      size_bytes: string | null
    } | null
    project_limits?: {
      project_id: string
      project_name: string
      total_land_limit_acres: string
      total_budget_ceiling: string
      total_employment_quota: number
    } | null
  } | null>(null)
  
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false)

  useEffect(() => {
    if (schedule.state !== 'Drafting') {
      fetch(`/api/proposals/${schedule.id}/form-xxii`)
        .then(res => res.json())
        .then(data => setFormXXIIStatus(data))
        .catch(console.error)
    }
  }, [schedule.id, schedule.state, isWorkspaceOpen])

  const handleGenerateForm = () => {
    setIsWorkspaceOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Hero Header & Collapsible Metadata */}
      <ProposalHeaderBar schedule={schedule} />

      {/* Collapsible Board Deviation Status */}
      {formXXIIStatus?.file && (
        <CollapsibleSectionCard
          title="Board Deviation Approved (Form-XXII Legal Clearances)"
          subtitle="Revised Land Limit, Budget Ceiling, & Employment Quota"
          icon={CheckCircle2}
          defaultOpen={false}
          badge={<Badge className="bg-emerald-600 text-white font-semibold">Approved</Badge>}
        >
          <div className="space-y-4">
            {formXXIIStatus.project_limits && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:bg-emerald-950/20 dark:border-emerald-900">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Revised Land Limit</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-950 dark:text-emerald-200">
                    {Number(formXXIIStatus.project_limits.total_land_limit_acres).toLocaleString('en-IN', { maximumFractionDigits: 4 })} Ac
                  </p>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:bg-emerald-950/20 dark:border-emerald-900">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Revised Budget Ceiling</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-950 dark:text-emerald-200">
                    ₹ {Number(formXXIIStatus.project_limits.total_budget_ceiling).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:bg-emerald-950/20 dark:border-emerald-900">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Revised Employment Quota</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-950 dark:text-emerald-200">
                    {formXXIIStatus.project_limits.total_employment_quota.toLocaleString('en-IN')} persons
                  </p>
                </div>
              </div>
            )}

            {formXXIIStatus.file && (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 bg-muted/20 flex-wrap">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Layers className="h-4 w-4 shrink-0 text-emerald-600" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{formXXIIStatus.file.original_name}</p>
                    {formXXIIStatus.file.attached_at && (
                      <p className="text-[11px] text-muted-foreground">
                        Uploaded {new Date(formXXIIStatus.file.attached_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild className="shrink-0 bg-background text-xs">
                  <a href={`/api/files/${formXXIIStatus.file.file_id}/download`} target="_blank" rel="noreferrer">
                    Download Signed PDF
                  </a>
                </Button>
              </div>
            )}
          </div>
        </CollapsibleSectionCard>
      )}

      {schedule.state === 'LimitBreached' && (
        <Alert variant="destructive" className="bg-rose-50/70 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900">
          <AlertCircle className="h-4 w-4 text-rose-600" />
          <AlertTitle className="text-rose-900 dark:text-rose-200 font-bold">Project Baseline Limits Breached</AlertTitle>
          <AlertDescription className="mt-2 text-rose-800 dark:text-rose-300 space-y-3">
            <p className="text-xs leading-relaxed">
              This proposal exceeds pre-authorized Project Limits (Land Area, Budget, or Employment Quota). 
              A <strong>Form-XXII (Deviation Justification)</strong> legal document must be generated and escalated for manual Board Approval before standard acquisition can resume.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleGenerateForm} 
                className="shadow-xs text-xs font-semibold"
              >
                <Layers className="mr-1.5 h-3.5 w-3.5" />
                {formXXIIStatus?.exists ? 'View / Update Form-XXII Workspace' : 'Generate Form-XXII'}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Tabs Container */}
      <AcquisitionDetailTabs schedule={schedule} />

      <DocumentWorkspaceModal 
        isOpen={isWorkspaceOpen} 
        onOpenChange={setIsWorkspaceOpen} 
        templateCode="FORM_XXII" 
        businessId={schedule.id} 
      />
    </div>
  )
}
