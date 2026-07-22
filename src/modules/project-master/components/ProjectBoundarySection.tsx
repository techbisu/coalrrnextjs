'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { MapPin, Pencil } from 'lucide-react'
import { SectionCard } from '@/components/coalrr'
import { BoundaryMapViewer } from '@/components/map/BoundaryMapViewer'
import { BoundaryDrawer, BoundaryCoordinates } from '@/components/map/BoundaryDrawer'
import { Can } from '@/authorization/components/Can'
import { useAppTranslation } from '@/localization/hooks/useAppTranslation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

interface ProjectBoundarySectionProps {
  project: {
    id: string
    boundary?: string
  }
}

export function ProjectBoundarySection({ project }: ProjectBoundarySectionProps) {
  const t = useAppTranslation('project_master')
  const queryClient = useQueryClient()

  const [boundaryDrawerOpen, setBoundaryDrawerOpen] = React.useState(false)
  const [localBoundary, setLocalBoundary] = React.useState<BoundaryCoordinates | undefined>(undefined)

  const saveBoundaryMutation = useMutation({
    mutationFn: async ({ projectId, boundary }: { projectId: string; boundary: BoundaryCoordinates }) => {
      const res = await fetch(`/api/projects/${projectId}/boundary`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boundary: JSON.stringify(boundary) }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save boundary')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Boundary saved to database.')
    },
    onError: (e: any) => toast.error(e.message),
  })

  const boundary = React.useMemo(() => {
    // Prefer locally-edited boundary (from BoundaryDrawer) over stored value
    if (localBoundary) return localBoundary
    if (!project?.boundary) return undefined
    try {
      const b = typeof project.boundary === 'string' ? JSON.parse(project.boundary) : project.boundary
      return { coordinates: b.coordinates, color: b.color }
    } catch (err) {
      console.error('Error parsing boundary:', err)
      return undefined 
    }
  }, [project, localBoundary])

  return (
    <>
      <SectionCard
        title={t('project_master.map.title', 'Project Boundary & Plots')}
        icon={MapPin}
        description={t('project_master.map.desc', 'PostGIS-style geometry viewer with statutory land-type color coding')}
        action={
          <Can permission="project.edit">
            <Button variant="outline" size="sm" onClick={() => setBoundaryDrawerOpen(true)}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit Boundary
            </Button>
          </Can>
        }
      >
        <BoundaryMapViewer
          coordinates={boundary?.coordinates}
          color={boundary?.color}
          height={380}
        />
      </SectionCard>

      <BoundaryDrawer
        open={boundaryDrawerOpen}
        onOpenChange={setBoundaryDrawerOpen}
        value={boundary}
        onChange={(b) => {
          setLocalBoundary(b)
          saveBoundaryMutation.mutate({ projectId: project.id, boundary: b })
        }}
      />
    </>
  )
}
