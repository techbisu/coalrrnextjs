'use client'

import * as React from 'react'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { AlertTriangle, CheckCircle2, Loader2, Lock } from 'lucide-react'
import { useAppTranslation } from '@/localization/hooks/useAppTranslation'

interface ProjectData {
  id: string
  name: string
  // other fields not strictly needed here
}

export function LockBaselineDialog({
  open, onOpenChange, project,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  project: ProjectData
}) {
  const qc = useQueryClient()
  const t = useAppTranslation('project_master')
  const [typedName, setTypedName] = React.useState('')

  React.useEffect(() => {
    if (open) setTypedName('')
  }, [open])

  const nameMatches = typedName.trim() === project.name

  const lockMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/projects/${project.id}/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmName: typedName.trim() }),
      })
      const json = await r.json()
      if (!r.ok) throw new Error(json?.error ?? t('project_master.lock_error', 'Failed to lock baseline'))
      return json
    },
    onSuccess: () => {
      toast.success(t('project_master.lock_success', { defaultValue: 'Baseline LOCKED for "{{name}}".', name: project.name }))
      qc.invalidateQueries({ queryKey: ['projects'] })
      onOpenChange(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('project_master.lock_baseline_title', 'Lock Baseline')}</DialogTitle>
          <DialogDescription>
            {t('project_master.lock_baseline_desc', 'This action is irreversible. Once locked, the project baseline (land limit, budget ceiling, employment quota) becomes immutable and downstream modules bind to it.')}
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive" className="border-destructive/50 bg-destructive/10 text-destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('project_master.irreversible_op', 'Irreversible operation')}</AlertTitle>
          <AlertDescription>
            {t('project_master.lock_confirm_prompt', 'You are about to lock the baseline for ')}
            <span className="font-semibold">{project.name}</span>. 
            {t('project_master.lock_type_confirm', 'Type the project name exactly as shown below to confirm.')}
          </AlertDescription>
        </Alert>

        <div className="grid gap-1.5">
          <Label htmlFor="lock-confirm">{t('project_master.type_name_to_confirm', 'Type the project name to confirm')}</Label>
          <Input
            id="lock-confirm"
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            placeholder={project.name}
            className="font-mono"
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">
            {nameMatches
              ? <span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle2 className="h-3 w-3" /> {t('project_master.name_matches', 'Name matches — ready to lock.')}</span>
              : <>{t('project_master.expected', 'Expected:')} <span className="font-mono font-medium">{project.name}</span></>}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={lockMutation.isPending}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={() => lockMutation.mutate()}
            disabled={!nameMatches || lockMutation.isPending}
            variant="destructive"
          >
            {lockMutation.isPending
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('common.locking', 'Locking…')}</>
              : <><Lock className="mr-2 h-4 w-4" /> {t('project_master.lock_baseline_btn', 'Lock Baseline')}</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
