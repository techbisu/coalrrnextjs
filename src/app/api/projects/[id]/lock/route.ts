/**
 * Lock Project Endpoint - Refactored to use Clean Architecture.
 * Locks the project baseline making it immutable.
 */
import { NextResponse } from 'next/server'
import { authorizeApi } from '@/authorization/middleware/authorize'
import { ok, badRequest, notFound, serverError } from '../../../_lib'
import type { NextRequest } from 'next/server'
import { lockProjectUseCase } from '@/infrastructure/di/Container'
import { PrismaProjectRepository } from '@/infrastructure/persistence/repositories/PrismaProjectRepository'
import { NotFoundException, DomainException } from '@/core/errors'
import { ProjectAlreadyLockedException } from '@/domain'
import { apiRateLimiter, getClientIdentifier } from '@/infrastructure/security'

type Ctx = { params: Promise<{ id: string }> }

const projectRepository = new PrismaProjectRepository() // kept for the manual name check

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

    // Authorization
    const auth = await authorizeApi('project.lock')
    if (auth.error) return auth.error

    const { id } = await ctx.params
    const body = await req.json()
    
    // Validation - require confirmation
    if (!body?.confirmName) {
      return badRequest('Confirmation required: type the project name to confirm')
    }
    
    // Verify confirmation name matches
    const project = await projectRepository.findById(id)
    if (!project) return notFound('Project not found')
    
    if (body.confirmName !== project.name) {
      return badRequest(`Confirmation name does not match "${project.name}"`)
    }

    const result = await lockProjectUseCase!.execute({
      project_id: id,
      user_id: auth.user.id,
    })

    if (result.isFailure) {
      if ((result.error as any) instanceof NotFoundException || String(result.error).includes('not found')) {
        return notFound(String(result.error))
      }
      if ((result.error as any) instanceof ProjectAlreadyLockedException) {
        return badRequest(String(result.error))
      }
      if ((result.error as any) instanceof DomainException) {
        return NextResponse.json(
          { error: String(result.error), code: String(result.error) },
          { status: 400 }
        )
      }
      throw result.error
    }

    return ok({
      success: true,
      data: result.value,
    })
  } catch (e: any) {
    console.error('POST /api/projects/[id]/lock error:', e)
    return serverError('Failed to lock baseline', e.message)
  }
}
