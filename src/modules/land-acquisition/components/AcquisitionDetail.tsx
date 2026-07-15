'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Building2, Calendar, Layers, MapPin, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { StateBadge } from '@/components/coalrr'
import { DocumentWorkspaceModal } from '@/modules/document-engine/presentation/components/DocumentWorkspaceModal'
import { formatNumber } from '@/lib/utils/formatters'
import { MODE_META, ScheduleDetail } from '../types'
import { AcquisitionDetailTabs } from './AcquisitionDetailTabs'

function MetaItem({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}

export function AcquisitionDetail({ schedule }: { schedule: ScheduleDetail }) {
  const router = useRouter()
  const [isApproveOpen, setIsApproveOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [oldLimit, setOldLimit] = useState(schedule.projectLandLimit || '')
  const [newLimit, setNewLimit] = useState(schedule.projectLandLimit || '')
  const [oldEstAmount, setOldEstAmount] = useState(schedule.projectBudgetCeiling || '')
  const [newEstAmount, setNewEstAmount] = useState(schedule.projectBudgetCeiling || '')
  const [oldJobCount, setOldJobCount] = useState(schedule.projectEmploymentQuota || '')
  const [newJobCount, setNewJobCount] = useState(schedule.projectEmploymentQuota || '')
  const [comments, setComments] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
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
    // Fetch form-xxii status for LimitBreached (to show generate button)
    // AND for any state after it (to show the approval summary banner)
    if (schedule.state !== 'Drafting') {
      fetch(`/api/proposals/${schedule.id}/form-xxii`)
        .then(res => res.json())
        .then(data => setFormXXIIStatus(data))
        .catch(console.error)
    }
  }, [schedule.id, schedule.state, isWorkspaceOpen]) // Refresh when workspace closes

  const handleGenerateForm = () => {
    setIsWorkspaceOpen(true)
  }

  const handleBoardApprove = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !oldLimit || !newLimit) {
      alert("Please provide the signed document, old limit, and new approved limit.")
      return
    }
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('oldLimitAcres', oldLimit)
      formData.append('extendedLimitAcres', newLimit)
      formData.append('oldCostLimit', oldEstAmount)
      formData.append('extendedCostLimit', newEstAmount)
      formData.append('oldEmploymentQuota', oldJobCount)
      formData.append('extendedEmploymentQuota', newJobCount)
      formData.append('comments', comments)

      const res = await fetch(`/api/proposals/${schedule.id}/board-approve`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (res.ok) {
        setIsApproveOpen(false)
        router.refresh()
      } else {
        alert(data.error || "Failed to approve deviation")
      }
    } catch (e: any) {
      alert(e.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const mode = MODE_META[schedule.acquisition_mode] ?? {
    label: schedule.acquisition_mode, checklistCode: 'CL-1', color: 'border-slate-300 bg-slate-50 text-slate-700',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button variant="outline" size="sm" asChild className="mt-0.5">
            <Link href="/proposals">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">{schedule.proposal_title}</h2>
              <StateBadge state={schedule.state} size="md" />
            </div>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{schedule.schedule_code}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`font-mono text-xs ${mode.color}`}>
            {mode.checklistCode} · {mode.label}
          </Badge>
        </div>
      </div>

      {/* Proposal meta strip */}
      <div className="grid gap-3 rounded-lg border border-border/60 bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetaItem icon={Building2} label="Project" value={schedule.projectName} />
        <MetaItem icon={MapPin} label="Area Office / Colliery" value={`${schedule.area_office || '—'} · ${schedule.mine_cd || '—'}`} />
        <MetaItem icon={Calendar} label="Notification Date" value={schedule.notification_date ? new Date(schedule.notification_date).toLocaleDateString('en-IN') : '—'} />
        <MetaItem icon={Layers} label="Total Area" value={`${formatNumber(schedule.total_area_acres, 4)} acres`} />
      </div>

      {formXXIIStatus?.file && (
        <Alert className="bg-green-50/50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Board Deviation Approved — Form-XXII</AlertTitle>
          <AlertDescription className="mt-3 text-green-800 space-y-4">

            {/* Updated project limits grid */}
            {formXXIIStatus.project_limits && (
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-md border border-green-200 bg-white px-3 py-2">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-green-600">Revised Land Limit</p>
                  <p className="mt-0.5 text-sm font-semibold text-green-900">
                    {Number(formXXIIStatus.project_limits.total_land_limit_acres).toLocaleString('en-IN', { maximumFractionDigits: 4 })} Ac
                  </p>
                </div>
                <div className="rounded-md border border-green-200 bg-white px-3 py-2">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-green-600">Revised Budget Ceiling</p>
                  <p className="mt-0.5 text-sm font-semibold text-green-900">
                    ₹ {Number(formXXIIStatus.project_limits.total_budget_ceiling).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="rounded-md border border-green-200 bg-white px-3 py-2">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-green-600">Revised Employment Quota</p>
                  <p className="mt-0.5 text-sm font-semibold text-green-900">
                    {formXXIIStatus.project_limits.total_employment_quota.toLocaleString('en-IN')} persons
                  </p>
                </div>
              </div>
            )}

            {/* Uploaded document row */}
            {formXXIIStatus.file && (
              <div className="flex items-center gap-3 rounded-md border border-green-200 bg-white px-3 py-2">
                <Layers className="h-4 w-4 shrink-0 text-green-600" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-green-600">Board-Approved Document</p>
                  <p className="truncate text-sm font-medium text-green-900">{formXXIIStatus.file.original_name}</p>
                  {formXXIIStatus.file.attached_at && (
                    <p className="text-[11px] text-green-600">
                      Uploaded {new Date(formXXIIStatus.file.attached_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="shrink-0 bg-white hover:bg-green-50 text-green-700 border-green-200 shadow-sm"
                >
                  <a href={`/api/files/${formXXIIStatus.file.file_id}/download`} target="_blank" rel="noreferrer">
                    Download
                  </a>
                </Button>
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerateForm}
              className="text-green-700 hover:bg-green-100 px-0"
            >
              <Layers className="mr-1.5 h-3.5 w-3.5" />
              View Form-XXII Workspace
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {schedule.state === 'LimitBreached' && (
        <Alert variant="destructive" className="bg-red-50/50 border-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Project Limits Breached</AlertTitle>
          <AlertDescription className="mt-2 text-red-800">
            <p className="mb-4 text-sm">
              This proposal exceeds the pre-authorized Project Limits (Land Area, Budget, or Employment Quota). 
              A <strong>Form-XXII (Deviation Justification)</strong> legal document must be generated and escalated for manual Board Approval before standard acquisition can resume.
            </p>
            <div className="flex items-center gap-3">
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleGenerateForm} 
                className="shadow-sm"
              >
                <Layers className="mr-1.5 h-3.5 w-3.5" />
                {formXXIIStatus?.exists ? 'View / Update Form-XXII' : 'Generate Form-XXII'}
              </Button>
              
              {formXXIIStatus?.exists && (
                <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="bg-white hover:bg-red-50 text-red-700 border-red-200 shadow-sm">
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                      Upload Board Approval
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Board-Approved Form-XXII</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleBoardApprove} className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Signed Document (PDF)</Label>
                      <Input type="file" accept=".pdf,.doc,.docx" onChange={e => setFile(e.target.files?.[0] || null)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Supporting Documents (Optional)</Label>
                      <Input type="file" multiple accept=".pdf,.png,.jpg,.doc,.docx" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Old Land Limit (Acres)</Label>
                        <Input type="number" step="0.01" value={oldLimit} onChange={e => setOldLimit(e.target.value)} required placeholder="e.g. 500" />
                      </div>
                      <div className="space-y-2">
                        <Label>Approved Land Limit (Acres)</Label>
                        <Input type="number" step="0.01" value={newLimit} onChange={e => setNewLimit(e.target.value)} required placeholder="e.g. 600" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Old Budget Ceiling (INR)</Label>
                        <Input type="number" step="0.01" value={oldEstAmount} onChange={e => setOldEstAmount(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Approved Budget Ceiling (INR)</Label>
                        <Input type="number" step="0.01" value={newEstAmount} onChange={e => setNewEstAmount(e.target.value)} required />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Old Employment Quota</Label>
                        <Input type="number" value={oldJobCount} onChange={e => setOldJobCount(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Approved Employment Quota</Label>
                        <Input type="number" value={newJobCount} onChange={e => setNewJobCount(e.target.value)} required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Approval Comments</Label>
                      <Textarea value={comments} onChange={e => setComments(e.target.value)} placeholder="Board resolution number or remarks..." />
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsApproveOpen(false)}>Cancel</Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Uploading...' : 'Confirm Approval'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Interactive Client Leaf containing the Tabs */}
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
