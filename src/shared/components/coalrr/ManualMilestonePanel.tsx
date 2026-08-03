'use client'

import * as React from 'react'
import { CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Plus, CheckCircle2, Clock, MapPin, X, FileText } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/components/ui/dialog'

export interface Milestone {
  id: string
  milestone_type: string
  authority: string | null
  reference_no: string | null
  milestone_date: string
  outcome: string
  remarks: string | null
  entry_ts: string
  entry_by: string
}

export interface ManualMilestonePanelProps {
  milestones: Milestone[]
  onAddSubmit?: (milestone: {
    milestone_type: string
    authority: string
    reference_no?: string
    outcome: string
    remarks?: string
  }) => Promise<void> | void
  readOnly?: boolean
  title?: string
  description?: string
  isDirectPurchase?: boolean
}

export function ManualMilestonePanel({
  milestones,
  onAddSubmit,
  readOnly,
  title,
  description,
  isDirectPurchase = false,
}: ManualMilestonePanelProps) {
  const [open, setOpen] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [formData, setFormData] = React.useState({
    milestone_type: isDirectPurchase ? 'SALE_DEED_REGISTRATION' : 'SECTION_4_NOTIFICATION',
    authority: '',
    reference_no: '',
    outcome: 'APPROVED',
    remarks: '',
  })

  React.useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      milestone_type: isDirectPurchase ? 'SALE_DEED_REGISTRATION' : 'SECTION_4_NOTIFICATION',
    }))
  }, [isDirectPurchase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!onAddSubmit) return
    try {
      setSubmitting(true)
      await onAddSubmit(formData)
      setOpen(false)
      setFormData({
        milestone_type: isDirectPurchase ? 'SALE_DEED_REGISTRATION' : 'SECTION_4_NOTIFICATION',
        authority: '',
        reference_no: '',
        outcome: 'APPROVED',
        remarks: '',
      })
    } catch (err) {
      console.error('Failed to submit milestone', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {(title || !readOnly) && (
        <div className="flex flex-row items-center justify-between pb-2">
          <div>
            {title && <h3 className="text-base font-semibold">{title}</h3>}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          {!readOnly && onAddSubmit && (
            <Button size="sm" onClick={() => setOpen(true)}>
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
              <div key={m.id} className="relative pl-6 pb-4 border-l last:border-l-0 last:pb-0 border-border">
                <div className="absolute left-[-5px] top-1 h-2.5 w-2.5 rounded-full bg-primary" />
                <div className="flex justify-between items-start mb-1 gap-2">
                  <div>
                    <h4 className="font-semibold text-sm">{m.milestone_type.replace(/_/g, ' ')}</h4>
                    <p className="text-xs text-muted-foreground">{new Date(m.milestone_date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p>
                  </div>
                  <Badge variant={m.outcome === 'APPROVED' ? 'default' : m.outcome === 'REJECTED' ? 'destructive' : 'secondary'}>
                    {m.outcome}
                  </Badge>
                </div>
                {(m.authority || m.reference_no) && (
                  <div className="text-xs text-muted-foreground mt-2 bg-muted/60 p-2.5 rounded-md space-y-0.5">
                    {m.authority && <p><strong>Authority:</strong> {m.authority}</p>}
                    {m.reference_no && <p><strong>Ref No:</strong> {m.reference_no}</p>}
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
            <DialogTitle>Add Land Milestone</DialogTitle>
            <DialogDescription>
              Record a milestone event for this proposal.
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
                {isDirectPurchase ? (
                  <>
                    <option value="SALE_DEED_REGISTRATION">Sale Deed Registration</option>
                    <option value="STAMP_DUTY_CLEARANCE">Stamp Duty Clearance</option>
                    <option value="VALUATION_APPROVAL">Valuation Committee Approval</option>
                    <option value="POSSESSION_HANDOVER">Physical Possession Handover</option>
                    <option value="BOARD_SANCTION">Board Administrative Approval</option>
                    <option value="MUTATION_COMPLETED">Land Mutation Completed</option>
                  </>
                ) : (
                  <>
                    <option value="SECTION_4_NOTIFICATION">Section 4 Gazette Notification</option>
                    <option value="SECTION_7_NOTIFICATION">Section 7 Gazette Notification</option>
                    <option value="SECTION_9_NOTIFICATION">Section 9 Gazette Notification</option>
                    <option value="SECTION_11_NOTIFICATION">Section 11 Declaration</option>
                    <option value="FORM_XXII_ISSUE">Form-XXII Public Notice</option>
                    <option value="OTHER_MILESTONE">Other Statutory Milestone</option>
                  </>
                )}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Authority Name</label>
              <input
                type="text"
                placeholder={isDirectPurchase ? "e.g. Sub-Registrar Office, Salanpur" : "e.g. District Magistrate & Collector"}
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
    </div>
  )
}
