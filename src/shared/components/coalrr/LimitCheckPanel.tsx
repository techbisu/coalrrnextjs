'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card'
import { Progress } from '@/shared/components/ui/progress'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert'

export interface LimitDetails {
  area: {
    project_limit_acres: number
    other_proposals_acres: number
    this_proposal_acres: number
    total_acres: number
    is_breached: boolean
  }
  budget: {
    project_ceiling_inr: number
    estimated_total_inr: number
    this_proposal_est_inr: number
    is_breached: boolean
  }
  employment: {
    project_quota: number
    estimated_total_jobs: number
    this_proposal_est_jobs: number
    is_breached: boolean
  }
}

export interface LimitCheckPanelProps {
  limits: LimitDetails | null
  loading?: boolean
}

function LimitBar({ label, current, total, max, isBreached, unit }: { label: string, current: number, total: number, max: number, isBreached: boolean, unit: string }) {
  const percentage = max > 0 ? Math.min((total / max) * 100, 100) : 0
  const isWarning = percentage > 80 && !isBreached

  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between items-center text-xs sm:text-sm mb-1">
        <span className="font-semibold text-slate-800">{label}</span>
        <div className="text-right">
          <span className="font-mono text-slate-700 font-medium">
            {current.toLocaleString('en-IN', { maximumFractionDigits: 2 })} {unit}
          </span>
          <span className="text-[11px] text-muted-foreground ml-1.5">
            (Total: {total.toLocaleString('en-IN', { maximumFractionDigits: 2 })} / {max.toLocaleString('en-IN', { maximumFractionDigits: 2 })})
          </span>
        </div>
      </div>
      <Progress 
        value={percentage} 
        className={`h-2 ${isBreached ? 'bg-destructive/20' : isWarning ? 'bg-orange-500/20' : ''}`} 
        indicatorClassName={isBreached ? 'bg-destructive' : isWarning ? 'bg-orange-500' : 'bg-primary'}
      />
      {isBreached && <p className="text-xs text-destructive mt-1 flex items-center font-medium"><AlertTriangle className="h-3 w-3 mr-1"/> Limit Breached</p>}
    </div>
  )
}

export function LimitCheckPanel({ limits, loading }: LimitCheckPanelProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Limits Check</CardTitle>
        </CardHeader>
        <CardContent className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </CardContent>
      </Card>
    )
  }

  if (!limits || !limits.area || !limits.budget || !limits.employment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Limits Check</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Limit data unavailable.</p>
        </CardContent>
      </Card>
    )
  }

  const hasBreaches = limits.area.is_breached || limits.budget.is_breached || limits.employment.is_breached

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          Project Limits Check
          {hasBreaches ? (
            <AlertTriangle className="h-5 w-5 text-destructive ml-2" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-green-500 ml-2" />
          )}
        </CardTitle>
        <CardDescription>Validates this proposal against project-level ceilings</CardDescription>
      </CardHeader>
      <CardContent>
        {hasBreaches && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Deviation Required</AlertTitle>
            <AlertDescription>
              This proposal breaches project limits. Board approval will be required to proceed.
            </AlertDescription>
          </Alert>
        )}

        <LimitBar 
          label="Land Area" 
          current={limits.area.this_proposal_acres} 
          total={limits.area.total_acres} 
          max={limits.area.project_limit_acres} 
          isBreached={limits.area.is_breached}
          unit="Acres"
        />
        
        <LimitBar 
          label="Budget" 
          current={limits.budget.this_proposal_est_inr} 
          total={limits.budget.estimated_total_inr} 
          max={limits.budget.project_ceiling_inr} 
          isBreached={limits.budget.is_breached}
          unit="INR"
        />

        <LimitBar 
          label="Employment Quota" 
          current={limits.employment.this_proposal_est_jobs} 
          total={limits.employment.estimated_total_jobs} 
          max={limits.employment.project_quota} 
          isBreached={limits.employment.is_breached}
          unit="Jobs"
        />
      </CardContent>
    </Card>
  )
}
