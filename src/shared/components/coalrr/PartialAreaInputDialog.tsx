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
import { Tabs, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { AlertCircle, Calculator, PieChart, Layers, RefreshCw } from 'lucide-react'

export interface LandTypeBreakdownProp {
  land_type_name: string
  total_area: number
}

export interface PartialAreaInputDialogProps {
  isOpen: boolean
  onClose: () => void
  plotNumber: string
  totalArea: number
  landTypesBreakdown?: LandTypeBreakdownProp[]
  onSubmit: (data: {
    totalPossArea: number
    toBeAcquiredArea: number
    remarks: string
    landTypeAdjustments?: Array<{ land_type_name: string; area_to_acquire: number }>
  }) => Promise<void>
}

export function PartialAreaInputDialog({
  isOpen,
  onClose,
  plotNumber,
  totalArea = 0,
  landTypesBreakdown = [],
  onSubmit,
}: PartialAreaInputDialogProps) {
  const [deductionMode, setDeductionMode] = React.useState<'PROPORTIONAL' | 'SPECIFIC'>('PROPORTIONAL')
  const [overallPurchased, setOverallPurchased] = React.useState<string>('0')
  const [remarks, setRemarks] = React.useState<string>('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Specific land type purchased inputs: map of [land_type_name -> purchased_area_string]
  const [specificPurchasedMap, setSpecificPurchasedMap] = React.useState<Record<string, string>>({})

  React.useEffect(() => {
    if (isOpen) {
      setDeductionMode('PROPORTIONAL')
      setOverallPurchased('0')
      setRemarks('Annexure C — Partially Purchased')
      setError(null)
      setIsSubmitting(false)

      const initialMap: Record<string, string> = {}
      for (const lt of landTypesBreakdown) {
        initialMap[lt.land_type_name] = '0'
      }
      setSpecificPurchasedMap(initialMap)
    }
  }, [isOpen, landTypesBreakdown])

  // Calculations for Proportional Mode
  const parsedOverallPurchased = parseFloat(overallPurchased) || 0
  const proportionalAcquired = Math.max(0, totalArea - parsedOverallPurchased)

  // Calculations for Specific Mode
  const specificCalculations = React.useMemo(() => {
    let sumPurchased = 0
    let sumAcquired = 0
    const adjustments: Array<{ land_type_name: string; area_to_acquire: number }> = []

    for (const lt of landTypesBreakdown) {
      const pVal = parseFloat(specificPurchasedMap[lt.land_type_name] || '0') || 0
      const acqVal = Math.max(0, lt.total_area - pVal)
      sumPurchased += pVal
      sumAcquired += acqVal
      adjustments.push({
        land_type_name: lt.land_type_name,
        area_to_acquire: Number(acqVal.toFixed(4)),
      })
    }

    return {
      sumPurchased: Number(sumPurchased.toFixed(4)),
      sumAcquired: Number(sumAcquired.toFixed(4)),
      adjustments,
    }
  }, [landTypesBreakdown, specificPurchasedMap])

  const effectivePurchased = deductionMode === 'PROPORTIONAL' ? parsedOverallPurchased : specificCalculations.sumPurchased
  const effectiveAcquired = deductionMode === 'PROPORTIONAL' ? proportionalAcquired : specificCalculations.sumAcquired

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isNaN(effectivePurchased) || effectivePurchased <= 0) {
      setError('Please enter a valid partial purchased area greater than 0.')
      return
    }
    if (effectivePurchased >= totalArea) {
      setError('Purchased area cannot be greater than or equal to total plot area. For full purchase, select "Already Purchased (Annexure B)".')
      return
    }

    if (deductionMode === 'SPECIFIC') {
      for (const lt of landTypesBreakdown) {
        const pVal = parseFloat(specificPurchasedMap[lt.land_type_name] || '0') || 0
        if (pVal > lt.total_area) {
          setError(`Purchased area for ${lt.land_type_name} (${pVal} Ac) cannot exceed its total area (${lt.total_area} Ac).`)
          return
        }
      }
    }

    try {
      setIsSubmitting(true)
      setError(null)
      await onSubmit({
        totalPossArea: effectivePurchased,
        toBeAcquiredArea: effectiveAcquired,
        remarks: remarks || `Annexure C — Partially Purchased ${effectivePurchased} Acres (${deductionMode === 'SPECIFIC' ? 'Specific Land Type Breakdown' : 'Proportional'})`,
        landTypeAdjustments: deductionMode === 'SPECIFIC' ? specificCalculations.adjustments : undefined,
      })
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to save partial area')
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasMultipleLandTypes = landTypesBreakdown.length > 1

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-amber-400 bg-amber-50 text-amber-800 text-xs px-2.5 py-0.5 dark:bg-amber-950 dark:text-amber-300">
                Annexure C — Partial Purchase Adjustment
              </Badge>
            </div>
            <DialogTitle className="text-base font-semibold flex items-center gap-2 mt-1">
              <PieChart className="h-5 w-5 text-amber-600" />
              Adjust Purchased Area for Plot {plotNumber}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Input existing purchased/possessed acreage. Net acquired area will refresh in the Mouza-Wise Abstract.
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
                  {effectiveAcquired.toFixed(4)} Acres
                </p>
              </div>
            </div>

            {/* Deduction Mode Selector (if multiple land types exist) */}
            {hasMultipleLandTypes && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Deduction Method</Label>
                <Tabs value={deductionMode} onValueChange={(val: any) => setDeductionMode(val)} className="w-full">
                  <TabsList className="grid grid-cols-2 w-full h-8 text-xs">
                    <TabsTrigger value="PROPORTIONAL" className="text-xs">
                      Proportional Across Plot
                    </TabsTrigger>
                    <TabsTrigger value="SPECIFIC" className="text-xs flex items-center gap-1">
                      <Layers className="h-3 w-3 text-amber-600" />
                      Specific Land Category
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            )}

            {/* Proportional Mode Input */}
            {deductionMode === 'PROPORTIONAL' ? (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1">
                  <Calculator className="h-3.5 w-3.5 text-muted-foreground" />
                  Already Purchased / Possessed Area (Total Acres) <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  max={totalArea - 0.0001}
                  value={overallPurchased}
                  onChange={(e) => setOverallPurchased(e.target.value)}
                  placeholder="e.g. 2.5000"
                  className="h-9 text-xs"
                />
              </div>
            ) : (
              /* Specific Land Category Mode Breakdown Inputs */
              <div className="space-y-3 rounded-lg border p-3 bg-card">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-xs font-bold flex items-center gap-1 text-foreground">
                    <Layers className="h-3.5 w-3.5 text-amber-600" />
                    Land Category Deduction Breakdown
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    Purchased Sum: <strong className="text-amber-600">{specificCalculations.sumPurchased.toFixed(4)} Ac</strong>
                  </span>
                </div>

                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {landTypesBreakdown.map((lt) => {
                    const currentP = specificPurchasedMap[lt.land_type_name] || '0'
                    const parsedP = parseFloat(currentP) || 0
                    const netAcq = Math.max(0, lt.total_area - parsedP)

                    return (
                      <div key={lt.land_type_name} className="flex flex-col gap-1.5 p-2 rounded-md bg-muted/40 border text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">{lt.land_type_name}</span>
                          <span className="text-[11px] font-mono text-muted-foreground">
                            Total: {lt.total_area.toFixed(4)} Ac · <span className="font-bold text-emerald-600 dark:text-emerald-400">Net Acq: {netAcq.toFixed(4)} Ac</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Label className="text-[11px] text-muted-foreground w-28 shrink-0">Purchased Area:</Label>
                          <Input
                            type="number"
                            step="0.0001"
                            min="0"
                            max={lt.total_area}
                            value={currentP}
                            onChange={(e) =>
                              setSpecificPurchasedMap({
                                ...specificPurchasedMap,
                                [lt.land_type_name]: e.target.value,
                              })
                            }
                            placeholder="0.0000"
                            className="h-8 text-xs font-mono"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Remarks */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Remarks / Boundary Description</Label>
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional notes e.g. 2.5000 Ac purchased specifically from Forest area..."
                className="min-h-[60px] text-xs"
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
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
            >
              {isSubmitting ? 'Saving...' : 'Save Annexure C Partial Tagging'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
