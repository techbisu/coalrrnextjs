'use client'

import * as React from 'react'
import { CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Plus, CheckCircle2, Clock, MapPin, X, FileText, Trash2, Paperclip, Pencil } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog"
import { DocumentUploader } from '@/shared/components/coalrr/DocumentUploader'
import { milestoneConfig } from '@/core/config/milestone.config'

export interface Milestone {
  id: string
  milestone_type: string
  authority: string | null
  reference_no: string | null
  milestone_date: string
  outcome: string
  remarks: string | null
  document_id: string | null
  entry_ts: string
  entry_by: string
}

export interface MilestoneDefinition {
  id: string
  label: string
  requires: readonly string[]
}

export interface ManualMilestonePanelProps {
  milestones: Milestone[]
  onAddSubmit?: (milestone: {
    milestone_type: string
    authority: string
    reference_no?: string
    outcome: string
    remarks?: string
    document_id?: string | null
  }) => Promise<void> | void
  onEditSubmit?: (id: string, milestone: {
    milestone_type: string
    authority: string
    reference_no?: string
    outcome: string
    remarks?: string
    document_id?: string | null
  }) => Promise<void> | void
  onDeleteSubmit?: (id: string) => Promise<void> | void
  readOnly?: boolean
  isDirectPurchase?: boolean
  title?: string
  description?: string
  config?: readonly MilestoneDefinition[]
}

export function ManualMilestonePanel({
  milestones,
  onAddSubmit,
  onEditSubmit,
  onDeleteSubmit,
  readOnly,
  title,
  description,
  config = milestoneConfig.CBA,
}: ManualMilestonePanelProps) {
  const [open, setOpen] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null)
  
  const [formData, setFormData] = React.useState({
    milestone_type: config[0]?.id || 'OTHER_MILESTONE',
    custom_title: '',
    authority: '',
    reference_no: '',
    outcome: 'APPROVED',
    remarks: '',
    document_id: '' as string | null,
  })

  React.useEffect(() => {
    if (open && !editingId) {
      setFormData(prev => ({
        ...prev,
        milestone_type: config[0]?.id || 'OTHER_MILESTONE',
        custom_title: '',
        authority: '',
        reference_no: '',
        outcome: 'APPROVED',
        remarks: '',
        document_id: null,
      }))
    }
  }, [open, config, editingId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      
      const typeToSubmit = formData.milestone_type === 'OTHER_MILESTONE' && formData.custom_title.trim() !== ''
        ? formData.custom_title.trim()
        : formData.milestone_type

      if (editingId && onEditSubmit) {
        await onEditSubmit(editingId, {
          milestone_type: typeToSubmit,
          authority: formData.authority,
          reference_no: formData.reference_no,
          outcome: formData.outcome,
          remarks: formData.remarks,
          document_id: formData.document_id
        })
      } else if (onAddSubmit) {
        await onAddSubmit({
          milestone_type: typeToSubmit,
          authority: formData.authority,
          reference_no: formData.reference_no,
          outcome: formData.outcome,
          remarks: formData.remarks,
          document_id: formData.document_id
        })
      }
      
      setOpen(false)
      setEditingId(null)
      setFormData({
        milestone_type: config[0]?.id || 'OTHER_MILESTONE',
        custom_title: '',
        authority: '',
        reference_no: '',
        outcome: 'APPROVED',
        remarks: '',
        document_id: null,
      })
    } catch (err) {
      console.error('Failed to submit milestone', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!onDeleteSubmit) return
    try {
      setDeletingId(id)
      await onDeleteSubmit(id)
    } catch (err) {
      console.error('Failed to delete milestone', err)
    } finally {
      setDeletingId(null)
      setConfirmDeleteId(null)
    }
  }

  const handleEditClick = (m: Milestone) => {
    setEditingId(m.id)
    const isStandardType = config.some(c => c.id === m.milestone_type)
    setFormData({
      milestone_type: isStandardType ? m.milestone_type : 'OTHER_MILESTONE',
      custom_title: isStandardType ? '' : m.milestone_type,
      authority: m.authority || '',
      reference_no: m.reference_no || '',
      outcome: m.outcome,
      remarks: m.remarks || '',
      document_id: m.document_id,
    })
    setOpen(true)
  }

  // Determine which options are available based on sequential logic
  const approvedTypes = new Set(milestones.filter(m => m.outcome === 'APPROVED').map(m => m.milestone_type))
  const availableOptions = config.filter(opt => {
    if (opt.id === 'OTHER_MILESTONE') return true
    return opt.requires.every(req => approvedTypes.has(req))
  })

  // Ensure selected type is valid
  React.useEffect(() => {
    if (availableOptions.length > 0 && !availableOptions.some(o => o.id === formData.milestone_type)) {
      setFormData(prev => ({ ...prev, milestone_type: availableOptions[0].id }))
    }
  }, [availableOptions, formData.milestone_type])

  return (
    <div className="space-y-4">
      {(title || !readOnly) && (
        <div className="flex flex-row items-center justify-between pb-2">
          <div>
            {title && <h3 className="text-base font-semibold">{title}</h3>}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          {!readOnly && onAddSubmit && (
            <Button size="sm" onClick={() => {
              setEditingId(null)
              setOpen(true)
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Milestone
            </Button>
          )}
        </div>
      )}
      <CardContent className="p-0">
        {milestones.length === 0 ? (
          <div className="text-center p-6 text-muted-foreground bg-muted/20 rounded-md border border-dashed text-sm">
            No milestones recorded yet.
          </div>
        ) : (
          <div className="space-y-4">
            {milestones.map((m) => (
              <div key={m.id} className="relative pl-6 pb-4 border-l last:border-l-0 last:pb-0 border-border group">
                <div className="absolute left-[-5px] top-1 h-2.5 w-2.5 rounded-full bg-primary" />
                <div className="flex justify-between items-start mb-1 gap-2">
                  <div>
                    <h4 className="font-semibold text-sm">{m.milestone_type.replace(/_/g, ' ')}</h4>
                    <p className="text-xs text-muted-foreground">{new Date(m.milestone_date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={m.outcome === 'APPROVED' ? 'default' : m.outcome === 'REJECTED' ? 'destructive' : 'secondary'}>
                      {m.outcome}
                    </Badge>
                    {!readOnly && onEditSubmit && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-primary transition-opacity"
                        onClick={() => handleEditClick(m)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {!readOnly && onDeleteSubmit && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                        onClick={() => setConfirmDeleteId(m.id)}
                        disabled={deletingId === m.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                {(m.authority || m.reference_no || m.document_id) && (
                  <div className="text-xs text-muted-foreground mt-2 bg-muted/60 p-2.5 rounded-md space-y-1">
                    {m.authority && <p><strong>Authority:</strong> {m.authority}</p>}
                    {m.reference_no && <p><strong>Ref No:</strong> {m.reference_no}</p>}
                    {m.document_id && (
                      <p className="flex items-center gap-1 text-primary cursor-pointer hover:underline" onClick={() => window.open(`/api/documents/${m.document_id}`, '_blank')}>
                        <Paperclip className="h-3 w-3" /> View Attachment
                      </p>
                    )}
                  </div>
                )}
                {m.remarks && (
                  <p className="text-xs mt-2 text-foreground/80 leading-relaxed">{m.remarks}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Land Milestone' : 'Add Land Milestone'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Update details for this milestone.' : 'Record a milestone event for this proposal.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Milestone Type</label>
              <select
                value={formData.milestone_type}
                onChange={(e) => setFormData({ ...formData, milestone_type: e.target.value })}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {availableOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
              {availableOptions.length < config.length && (
                <p className="text-[10px] text-muted-foreground">Some options are hidden until prerequisites are met.</p>
              )}
            </div>

            {formData.milestone_type === 'OTHER_MILESTONE' && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Custom Milestone Name</label>
                <input
                  type="text"
                  placeholder="e.g. Forest Clearance Stage 1"
                  value={formData.custom_title}
                  onChange={(e) => setFormData({ ...formData, custom_title: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  required
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Authority Name</label>
              <input
                type="text"
                placeholder="e.g. District Magistrate & Collector"
                value={formData.authority}
                onChange={(e) => setFormData({ ...formData, authority: e.target.value })}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Reference / Letter No.</label>
                <input
                  type="text"
                  placeholder="e.g. REG/2026/0481"
                  value={formData.reference_no}
                  onChange={(e) => setFormData({ ...formData, reference_no: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Status / Outcome</label>
                <select
                  value={formData.outcome}
                  onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="APPROVED">APPROVED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <DocumentUploader
                checklist_item_key="MILESTONE_DOCUMENT"
                label="Supporting Document (Optional)"
                mode="single"
                documents={formData.document_id ? [{ file_name: 'Existing Document', file_size_kb: 0, mime_type: '', virus_scan_status: 'clean', id: formData.document_id }] : []}
                onChange={(doc) => {
                  if (Array.isArray(doc)) return;
                  setFormData(prev => ({ ...prev, document_id: doc.id || null }))
                }}
                onRemove={() => {
                  setFormData(prev => ({ ...prev, document_id: null }))
                }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Remarks / Summary</label>
              <textarea
                rows={3}
                placeholder="Enter details or comments regarding this milestone..."
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                className="w-full rounded-md border border-input bg-background p-3 text-sm"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Milestone'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!confirmDeleteId} onOpenChange={(isOpen) => !isOpen && setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Milestone</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this milestone? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault()
                if (confirmDeleteId) handleDelete(confirmDeleteId)
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingId ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
