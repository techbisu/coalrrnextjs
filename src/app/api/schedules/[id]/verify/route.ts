/**
 * Proposal Workflow/Verify API - Refactored to use Clean Architecture.
 * Uses proper use cases for state transitions.
 */
import { NextResponse } from 'next/server'
import { authorizeApi } from '@/authorization/middleware/authorize'
import { ok, badRequest, serverError, notFound } from '../../../_lib'
import type { NextRequest } from 'next/server'
import { PrismaProposalRepository } from '@/infrastructure/persistence/repositories/PrismaProposalRepository'
import { PrismaProjectRepository } from '@/infrastructure/persistence/repositories/PrismaProjectRepository'
import { SubmitProposalUseCase } from '@/application/use-cases/proposal'
import { apiRateLimiter, getClientIdentifier } from '@/infrastructure/security'
import { DomainException, NotFoundException } from '@/core/errors'

type Ctx = { params: Promise<{ id: string }> }

const proposalRepository = new PrismaProposalRepository()
const projectRepository = new PrismaProjectRepository()

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(req)
    const rateLimit = apiRateLimiter.check(clientId)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests', retryAfter: rateLimit.retryAfter },
        { status: 429 }
      )
    }

    const auth = await authorizeApi('acquisition.edit')
    if (auth.error) return auth.error

    const { id } = await ctx.params
    const body = await req.json()
    if (!body?.action) return badRequest('action required (submit | approve | reject)')

    // Handle different actions with respective use cases
    if (body.action === 'submit') {
      const useCase = new SubmitProposalUseCase(proposalRepository, projectRepository)
      const result = await useCase.execute({
        proposalId: id,
        user_id: auth.user.id,
        comments: body.comments,
      })

      if (result.isFailure) {
        if ((result.error as any) instanceof NotFoundException || String(result.error).includes('not found')) return notFound(String(result.error))
        if ((result.error as any) instanceof DomainException) return badRequest(String(result.error))
        throw result.error
      }

      return ok({ success: true, data: result.value })
    } 
    // Approvals and Rejections would be handled by their respective use cases
    // For now we'll throw an error if those actions are attempted until we build the use cases
    else {
      return badRequest(`Action '${body.action}' not yet implemented in new architecture`)
    }
  } catch (e: any) {
    console.error('POST /api/schedules/[id]/verify error:', e)
    return serverError('Failed to verify schedule', e.message)
  }
}
