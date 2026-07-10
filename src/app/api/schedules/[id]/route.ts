/**
 * Proposal Details API - Refactored to use Clean Architecture.
 * Uses proper use cases for retrieval and updating.
 */
import { NextResponse } from 'next/server'
import { authorizeApi } from '@/authorization/middleware/authorize'
import { ok, notFound, serverError } from '../../_lib'
import type { NextRequest } from 'next/server'
import { PrismaProposalRepository } from '@/infrastructure/persistence/repositories/PrismaProposalRepository'
import { GetProposalDetailsUseCase, UpdateProposalUseCase } from '@/application/use-cases/proposal'
import { validateBody } from '@/application/middleware/validation'
import { UpdateProposalSchema } from '@/application/validators/schemas'
import { apiRateLimiter, getClientIdentifier } from '@/infrastructure/security'
import { NotFoundException, DomainException, ValidationException } from '@/core/errors'

type Ctx = { params: Promise<{ id: string }> }

const proposalRepository = new PrismaProposalRepository()

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const auth = await authorizeApi('acquisition.view')
    if (auth.error) return auth.error

    const { id } = await ctx.params
    
    const useCase = new GetProposalDetailsUseCase(proposalRepository)
    const result = await useCase.execute({ proposalId: id })

    if (result.isFailure) {
      if ((result.error as any) instanceof NotFoundException || String(result.error).includes('not found')) {
        return notFound(String(result.error))
      }
      throw result.error
    }

    return ok(result.value)
  } catch (e: any) {
    console.error('GET /api/schedules/[id] error:', e)
    return serverError('Failed to load schedule', e.message)
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
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
    
    // Validation
    const bodyResult = await validateBody(req, UpdateProposalSchema)
    if (!bodyResult.success) return bodyResult.error

    const useCase = new UpdateProposalUseCase(proposalRepository)
    const result = await useCase.execute({
      proposalId: id,
      ...bodyResult.data,
      notification_date: bodyResult.data.notification_date ? new Date(bodyResult.data.notification_date) : undefined,
      user_id: auth.user.id
    })

    if (result.isFailure) {
      if ((result.error as any) instanceof NotFoundException || String(result.error).includes('not found')) return notFound(String(result.error))
      if ((result.error as any) instanceof ValidationException) {
        return NextResponse.json({ error: String(result.error), details: (result.error as any) }, { status: 400 })
      }
      if ((result.error as any) instanceof DomainException) {
        return NextResponse.json({ error: String(result.error), code: String(result.error) }, { status: 400 })
      }
      throw result.error
    }

    return ok(result.value)
  } catch (e: any) {
    console.error('PATCH /api/schedules/[id] error:', e)
    return serverError('Failed to update schedule', e.message)
  }
}
