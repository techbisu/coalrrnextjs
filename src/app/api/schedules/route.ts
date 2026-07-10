// GET  /api/schedules — list land acquisition schedules
// POST /api/schedules — create a new acquisition proposal
import { authorizeApi } from '@/authorization/middleware/authorize'
import { ok, badRequest, serverError, readJson } from '../_lib'
import { getCurrentUser } from '@/lib/auth'
import type { NextRequest } from 'next/server'
import { GetProposalsUseCase, CreateProposalUseCase } from '@/application/use-cases/proposal'
import { PrismaProposalRepository } from '@/infrastructure/persistence/repositories/PrismaProposalRepository'
import { PrismaProjectRepository } from '@/infrastructure/persistence/repositories/PrismaProjectRepository'

export async function GET() {
  try {
    const auth = await authorizeApi('acquisition.view')
    if (auth.error) return auth.error

    const proposalRepo = new PrismaProposalRepository()
    const projectRepo = new PrismaProjectRepository()
    const useCase = new GetProposalsUseCase(proposalRepo, projectRepo)
    
    const result = await useCase.execute()
    if (result.isFailure) return serverError('Failed to load schedules', String(result.error))

    return ok(result.value)
  } catch (e) {
    return serverError('Failed to load schedules', e instanceof Error ? e.message : String(e))
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authorizeApi('acquisition.create')
    if (auth.error) return auth.error

    const user = await getCurrentUser()
    if (!user) return badRequest('user not found')

    const body = await readJson<{ project_id?: string; acquisition_mode?: string; proposal_title?: string; description?: string; area_office?: string; colliery_code?: string; adjacent_colliery?: string; notification_date?: string }>(req)
    if (!body?.project_id || !body.acquisition_mode || !body.proposal_title) return badRequest('project_id, acquisition_mode, proposal_title required')
    
    const proposalRepo = new PrismaProposalRepository()
    const projectRepo = new PrismaProjectRepository()
    const useCase = new CreateProposalUseCase(proposalRepo, projectRepo)

    const result = await useCase.execute({
      project_id: body.project_id,
      acquisition_mode: body.acquisition_mode,
      proposal_title: body.proposal_title,
      description: body.description,
      area_office: body.area_office,
      adjacent_colliery: body.adjacent_colliery,
      notification_date: body.notification_date ? new Date(body.notification_date) : undefined,
      user_id: user.id.toString(),
      user_name: user.name,
      user_role: user.role,
    })

    if (result.isFailure) {
      return badRequest(String(result.error) || 'Failed to create proposal')
    }

    return ok(result.value, { status: 201 })
  } catch (e) {
    return serverError('Failed to create schedule', e instanceof Error ? e.message : String(e))
  }
}
