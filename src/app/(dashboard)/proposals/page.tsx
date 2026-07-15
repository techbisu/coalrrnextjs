import * as React from 'react'
import { authorizeApi } from '@/core/authorization/middleware/authorize'
import { redirect } from 'next/navigation'
import { AcquisitionList } from '@/modules/land-acquisition/components/AcquisitionList'
import { AcquisitionDetail } from '@/modules/land-acquisition/components/AcquisitionDetail'

import { PrismaProposalRepository } from '@/infrastructure/persistence/repositories/PrismaProposalRepository'
import { PrismaProjectRepository } from '@/infrastructure/persistence/repositories/PrismaProjectRepository'
import { GetProposalDetailsUseCase, GetProposalsUseCase } from '@/application/use-cases/proposal'
import { ScheduleListItem, ScheduleDetail } from '@/modules/land-acquisition/types'

export const metadata = {
  title: 'Land Acquisition - COALRR',
}

interface PageProps {
  searchParams: Promise<{ schedule_id?: string }>
}

export default async function ProposalsPage({ searchParams }: PageProps) {
  const auth = await authorizeApi('acquisition.view')
  
  if (auth.error) {
    redirect('/')
  }

  const resolvedSearchParams = await searchParams
  const schedule_id = resolvedSearchParams.schedule_id

  if (schedule_id) {
    // Detail View RSC
    const repository = new PrismaProposalRepository()
    const useCase = new GetProposalDetailsUseCase(repository)
    const result = await useCase.execute({ proposalId: schedule_id })
    
    if (result.isFailure) {
      // If not found, redirect to list
      redirect('/proposals')
    }

    // Cast the returned DTO to the expected component type (or map it)
    const schedule = result.value as unknown as ScheduleDetail
    
    return <AcquisitionDetail schedule={schedule} />
  } else {
    // List View RSC
    const proposalRepo = new PrismaProposalRepository()
    const projectRepo = new PrismaProjectRepository()
    const listUseCase = new GetProposalsUseCase(proposalRepo, projectRepo)
    
    const rawSchedulesResult = await listUseCase.execute()
    const rawSchedules = rawSchedulesResult.isSuccess ? rawSchedulesResult.value : []
    
    const schedules: ScheduleListItem[] = rawSchedules.map((s: any) => ({
      id: s.id.toString(),
      schedule_code: s.schedule_code,
      project_id: s.project_id.toString(),
      projectName: s.projectName,
      acquisition_mode: s.acquisition_mode,
      state: s.state,
      proposal_title: s.proposal_title,
      description: s.description,
      proposed_by: s.proposed_by,
      proposed_by_role: s.proposed_by_role,
      area_office: s.area_office,
      mine_cd: s.mine_cd,
      adjacent_colliery: s.adjacent_colliery,
      total_area_acres: s.total_area_acres.toString(),
      notification_date: s.notification_date?.toISOString(),
      itemSummary: s.itemSummary,
      entry_ts: s.entry_ts?.toISOString() ?? new Date().toISOString(),
    }))

    return <AcquisitionList schedules={schedules} />
  }
}
