'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { SectionCard } from '@/shared/components/coalrr'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { CheckCircle2, FileText, Loader2 } from 'lucide-react'
import { useAppTranslation } from '@/localization/hooks/useAppTranslation'

async function fetchProposals(): Promise<any[]> {
  const r = await fetch('/api/proposals', {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
  })
  if (!r.ok) throw new Error('Failed to load proposals')
  const json = await r.json()
  return json.data || json
}

export function ProjectProposalsList({ projectId }: { projectId: string }) {
  const t = useAppTranslation('project_master')
  const { data: allProposals, isLoading } = useQuery({ 
    queryKey: ['proposals'], 
    queryFn: fetchProposals 
  })

  const projectProposals = React.useMemo(() => {
    return allProposals?.filter(p => p.project_id === projectId) || []
  }, [allProposals, projectId])

  return (
    <SectionCard 
      title="Land Acquisition Proposals" 
      icon={FileText} 
      description="Proposals mapped to this project"
    >
      {isLoading ? (
        <div className="flex justify-center p-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : projectProposals.length > 0 ? (
        <ul className="space-y-3">
          {projectProposals.map((a: any) => (
            <li
              key={a.id}
              className="flex flex-col gap-2 rounded-lg border bg-card p-3 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span className="font-mono text-xs font-semibold text-emerald-700">{a.schedule_code}</span>
                  <Badge variant="outline" className="text-[10px] bg-background">
                    {a.state}
                  </Badge>
                </div>
                {a.proposal_title && (
                  <p className="text-sm text-foreground truncate">{a.proposal_title}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button variant="ghost" size="sm" asChild className="h-8 text-muted-foreground hover:text-foreground">
                  <a href={`/proposals?schedule_id=${a.id}`}>
                    {t('common.view_proposal', 'View Proposal →')}
                  </a>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-6 border border-dashed rounded-lg">
          No proposals found for this project.
        </p>
      )}
    </SectionCard>
  )
}

export default ProjectProposalsList
