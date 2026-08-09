'use client'

import * as React from 'react'
import { ProjectBoundarySection } from './ProjectBoundarySection'
import { GenericChecklistWorkspace } from '@/core/checklist/components/GenericChecklistWorkspace'
import { useAuth } from '@/authorization/providers/AuthProvider'

export function ProjectDocumentsSection({ project }: { project: any }) {
  const { user } = useAuth()
  
  if (!project) return null

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* GIS Map */}
      <div className="lg:col-span-2">
        <ProjectBoundarySection project={project} />
      </div>

      {/* Dynamic Project Files & Clearances */}
      <GenericChecklistWorkspace
        key={`checklist-${project.id}`}
        moduleCode="PROJECT_MASTER"
        checkableType="project"
        checkableId={project.id}
        userId={user?.id || 'system'}
      />
    </div>
  )
}

export default ProjectDocumentsSection
