import * as React from 'react'
import { ProjectMasterView } from '@/modules/project-master/components/ProjectMasterView'
import { authorizeApi } from '@/core/authorization/middleware/authorize'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Project Master - COALRR',
}

export default async function ProjectsPage() {
  // Enterprise Service Architecture:
  // We authorize the user on the server BEFORE rendering the client component.
  const auth = await authorizeApi('project.view')
  
  if (auth.error) {
    redirect('/')
  }

  return <ProjectMasterView />
}
