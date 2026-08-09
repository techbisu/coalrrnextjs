'use client'

import React from 'react'
import { Progress } from '@/shared/components/ui/progress'
import { Badge } from '@/shared/components/ui/badge'
import { CheckCircle2, AlertTriangle, FileText, Sparkles } from 'lucide-react'

interface ChecklistHeaderProgressProps {
  totalItems: number;
  satisfiedItemsCount: number;
  mandatoryItemsCount: number;
  satisfiedMandatoryCount: number;
  generatedFormsCount: number;
  operationalItemsCount: number;
}

export function ChecklistHeaderProgress({
  totalItems,
  satisfiedItemsCount,
  mandatoryItemsCount,
  satisfiedMandatoryCount,
  generatedFormsCount,
  operationalItemsCount
}: ChecklistHeaderProgressProps) {
  const overallPercentage = totalItems > 0 ? Math.round((satisfiedItemsCount / totalItems) * 100) : 0;
  const isAllMandatorySatisfied = mandatoryItemsCount === 0 || satisfiedMandatoryCount === mandatoryItemsCount;

  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-card via-card to-muted/20 p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-foreground">Compliance & Clearances Status</h3>
            {isAllMandatorySatisfied ? (
              <Badge className="bg-emerald-500 text-white gap-1 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" /> All Mandatory Met
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800 gap-1 text-xs">
                <AlertTriangle className="w-3.5 h-3.5" /> Mandatory Requirements Pending
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {satisfiedMandatoryCount} of {mandatoryItemsCount} mandatory items satisfied ({satisfiedItemsCount} of {totalItems} total rules completed)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {generatedFormsCount > 0 && (
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800 text-xs py-1 px-2.5">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              {generatedFormsCount} Generated Forms
            </Badge>
          )}
          <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800 text-xs py-1 px-2.5">
            <FileText className="w-3.5 h-3.5 mr-1" />
            {operationalItemsCount} Operational Items
          </Badge>
        </div>
      </div>

      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-muted-foreground">Overall Compliance Completion</span>
          <span className="text-foreground font-mono">{overallPercentage}%</span>
        </div>
        <Progress value={overallPercentage} className="h-2.5 bg-muted/60" indicatorClassName={overallPercentage === 100 ? 'bg-emerald-500' : 'bg-primary'} />
      </div>
    </div>
  )
}
