'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Calculator, AlertCircle, IndianRupee, TrendingUp, Plus } from 'lucide-react'

export interface MathPreviewResultLike {
  solatium: string
  escalation: string
  total: string
  breakdown: { base: string; solatium: string; escalation: string }
  formula?: string
}

export interface MathPreviewPanelProps {
  result: MathPreviewResultLike | null
  loading?: boolean
  error?: string
  formula?: string
  className?: string
  /** When true, show "live preview" pulse on changes */
  live?: boolean
}

export function MathPreviewPanel({
  result,
  loading,
  error,
  formula,
  className,
  live = true,
}: MathPreviewPanelProps) {
  const totalKey = result?.total ?? ''
  return (
    <Card className={cn('border-amber-200/60 bg-gradient-to-br from-amber-50/40 to-card shadow-sm dark:border-amber-900/40 dark:from-amber-950/10', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              <Calculator className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm">Math Engine Preview</CardTitle>
              <CardDescription className="text-[11px]">Live statutory calculation (decimal.js — no floats)</CardDescription>
            </div>
          </div>
          {live && !error && result && (
            <Badge variant="outline" className="gap-1 border-emerald-300 bg-emerald-50 text-[10px] text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              LIVE
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : error ? (
          <div className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Calculation unavailable</p>
              <p className="mt-0.5 text-xs">{error}</p>
            </div>
          </div>
        ) : !result ? (
          <div className="flex items-center justify-center gap-2 rounded-md border border-dashed border-border bg-muted/20 px-3 py-8 text-center text-sm text-muted-foreground">
            <Calculator className="h-4 w-4 opacity-50" />
            Enter values to see calculated award
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <StatTile
                label="Base Value"
                value={result.breakdown.base}
                icon={IndianRupee}
                formula="land + asset"
              />
              <StatTile
                label="Solatium (100%)"
                value={result.solatium}
                icon={Plus}
                formula="100% × (land + asset)"
                accent="violet"
              />
              <StatTile
                label="Escalation (12% p.a.)"
                value={result.escalation}
                icon={TrendingUp}
                formula="12% × land × years"
                accent="amber"
              />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={totalKey}
                initial={live ? { scale: 0.98, opacity: 0.6 } : false}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.18 }}
                className="flex items-center justify-between rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950/40"
              >
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Total Award</p>
                  <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80">Payable to landowner</p>
                </div>
                <p className="text-2xl font-bold tabular-nums text-emerald-800 dark:text-emerald-200">
                  {result.total}
                </p>
              </motion.div>
            </AnimatePresence>

            {formula && (
              <p className="rounded-md bg-muted/40 px-2.5 py-1.5 font-mono text-[10px] leading-relaxed text-muted-foreground">
                {formula}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

function StatTile({
  label, value, icon: Icon, formula, accent = 'slate',
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  formula: string
  accent?: 'slate' | 'violet' | 'amber'
}) {
  const colors: Record<string, string> = {
    slate: 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300',
    violet: 'text-violet-600 bg-violet-100 dark:bg-violet-950 dark:text-violet-300',
    amber: 'text-amber-600 bg-amber-100 dark:bg-amber-950 dark:text-amber-300',
  }
  return (
    <div className="rounded-lg border border-border/60 bg-card p-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className={cn('flex h-6 w-6 items-center justify-center rounded', colors[accent])}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <p className="mt-1 text-base font-semibold tabular-nums">{value}</p>
      <p className="mt-0.5 font-mono text-[10px] text-muted-foreground/80">{formula}</p>
    </div>
  )
}
