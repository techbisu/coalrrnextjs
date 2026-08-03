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
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { Badge } from '@/shared/components/ui/badge'
import { AlertCircle, Calculator, PieChart } from 'lucide-react'

export interface PartialAreaInputDialogProps {
  isOpen: boolean
  onClose: () => void
  plotNumber: string
  totalArea: number
  onSubmit: (data: { totalPossArea: number; toBeAcquiredArea: number; remarks: string }) => Promise<void>
}

export function PartialAreaInputDialog({
  isOpen,
  onClose,
  plotNumber,
  totalArea = 0,
  onSubmit,
}: PartialAreaInputDialogProps) {
  const [purchasedArea, setPurchasedArea] = React.useState<string>('0')
  const [remarks, setRemarks] = React.useState<string>('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (isOpen) {
      setPurchasedArea('0')
      setRemarks(`Annexure C — Partially Purchased`)
      setError(null)
      setIsSubmitting(false)
    }
  }, [isOpen])

  const parsedPurchased = parseFloat(purchasedArea) || 0
  const calculatedAcquired = Math.max(0, totalArea - parsedPurchased)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isNaN(parsedPurchased) || parsedPurchased <= 0) {
      setError('Please enter a valid partial purchased area greater than 0.')
      return
    }
    if (parsedPurchased >= totalArea) {
      setError('Purchased area cannot be greater than or equal to total plot area. For full purchase, select "Already Purchased (Annexure B)".')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      await onSubmit({
        totalPossArea: parsedPurchased,
        toBeAcquiredArea: calculatedAcquired,
        remarks: remarks || `Annexure C — Partially Purchased ${parsedPurchased} Acres`,
      })
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to save partial area')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-amber-400 bg-amber-50 text-amber-800 text-xs px-2.5 py-0.5 dark:bg-amber-950 dark:text-amber-300">
                Annexure C — Partial Purchase
              </Badge>
            </div>
            <DialogTitle className="text-base font-semibold flex items-center gap-2 mt-1">
              <PieChart className="h-5 w-5 text-amber-600" />
              Specify Purchased Area for Plot {plotNumber}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Input the existing purchased/possessed acreage. The system will auto-deduct it from total plot area for acquisition calculations.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Total Plot Area Summary */}
            <div className="grid grid-cols-2 gap-3 rounded-lg border border-border/60 bg-muted/30 p-3 text-xs">
              <div>
                <span className="text-muted-foreground font-medium">Total Plot ROR Area:</span>
                <p className="text-sm font-bold text-foreground mt-0.5">{totalArea.toFixed(4)} Acres</p>
              </div>
              <div>
                <span className="text-muted-foreground font-medium">Net Acquired Area:</span>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {calculatedAcquired.toFixed(4)} Acres
                </p>
              </div>
            </div>

            {/* Input Purchased Area */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1">
                <Calculator className="h-3.5 w-3.5 text-muted-foreground" />
                Already Purchased / Possessed Area (Acres) <span className="text-rose-500">*</span>
              </Label>
              <Input
                type="number"
                step="0.0001"
                min="0.0001"
                max={totalArea - 0.0001}
                value={purchasedArea}
                onChange={(e) => setPurchasedArea(e.target.value)}
                placeholder="e.g. 1.2500"
                className="h-9 text-xs"
              />
            </div>

            {/* Remarks */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Remarks / Boundary Description</Label>
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional remarks on partial purchase boundaries or survey notes..."
                className="min-h-[70px] text-xs"
              />
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
              disabled={isSubmitting}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isSubmitting ? 'Saving...' : 'Save Annexure C Partial Tagging'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
