// GET  /api/schedules — list land acquisition schedules
// POST /api/schedules — create a new acquisition proposal
import { authorizeApi } from '@/authorization/middleware/authorize'
import { ok, badRequest, serverError } from '../_lib'
import { getCurrentUser } from '@/lib/auth'
import type { NextRequest } from 'next/server'
import { GetProposalsUseCase, CreateProposalUseCase } from '@/application/use-cases/proposal'
import { PrismaAcqProposalRepository } from '@/infrastructure/persistence/repositories/PrismaAcqProposalRepository'
import { PrismaProjectRepository } from '@/infrastructure/persistence/repositories/PrismaProjectRepository'
import { CreateProposalSchema } from '@/core/validation/schemas/proposal.schema'

export async function GET() {
  try {
    let auth = await authorizeApi('proposal.view')
    if (auth.error) {
      auth = await authorizeApi('acquisition.view')
    }
    if (auth.error) return auth.error

    const user = await getCurrentUser()
    const proposalRepo = new PrismaAcqProposalRepository()
    const projectRepo = new PrismaProjectRepository()
    const useCase = new GetProposalsUseCase(proposalRepo, projectRepo)
    
    const result = await useCase.execute({ scope: user?.scope })
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

    const body = await req.json()

    // Zod validation via centralized schema
    const parseResult = CreateProposalSchema.safeParse(body)
    if (!parseResult.success) {
      return badRequest(`Validation failed: ${parseResult.error.issues.map(e => e.message).join(', ')}`)
    }
    const data = parseResult.data

    const proposalRepo = new PrismaAcqProposalRepository()
    const projectRepo = new PrismaProjectRepository()
    const useCase = new CreateProposalUseCase(proposalRepo, projectRepo)

    const result = await useCase.execute({
      project_id: data.project_id,
      acquisition_mode: data.acquisition_mode,
      proposal_title: data.proposal_title,
      description: data.description,
      area_office: data.area_office,
      adjacent_colliery: data.adjacent_colliery,
      notification_date: data.notification_date ? new Date(data.notification_date) : undefined,
      user_id: user.id.toString(),
      user_name: user.name,
      user_role: user.roles[0] || 'User',
    })

    if (result.isFailure) {
      return badRequest(String(result.error) || 'Failed to create proposal')
    }

    return ok(result.value, { status: 201 })
  } catch (e) {
    return serverError('Failed to create schedule', e instanceof Error ? e.message : String(e))
  }
}
