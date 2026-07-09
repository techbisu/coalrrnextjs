/**
 * Projects API - Refactored to use Clean Architecture.
 * Uses validation middleware, use cases, and proper error handling.
 */
import { NextResponse } from 'next/server'
import { authorizeApi } from '@/authorization/middleware/authorize'
import { serverError, ok } from '../_lib'
import type { NextRequest } from 'next/server'
import { validateBody, validateQuery } from '@/application/middleware/validation'
import { CreateProjectSchema, PaginationSchema } from '@/application/validators/schemas'
import { CreateProjectUseCase, GetProjectDashboardUseCase } from '@/application/use-cases/project'
import { PrismaProjectRepository } from '@/infrastructure/persistence/repositories/PrismaProjectRepository'
import { apiRateLimiter, getClientIdentifier } from '@/infrastructure/security'
import { DomainException, ValidationException } from '@/core/errors'

// Initialize dependencies (in production, use DI container)
const projectRepository = new PrismaProjectRepository()

export async function GET(req: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(req)
    const rateLimit = apiRateLimiter.check(clientId)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests', retryAfter: rateLimit.retryAfter },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimit.resetAt).toISOString(),
            'Retry-After': (rateLimit.retryAfter || 0).toString(),
          }
        }
      )
    }

    // Authorization
    const auth = await authorizeApi('project.view')
    if (auth.error) return auth.error

    // Validation
    const queryResult = validateQuery(req, PaginationSchema)
    if (!queryResult.success) return queryResult.error

    // Execute use case
    const useCase = new GetProjectDashboardUseCase(projectRepository)
    const result = await useCase.execute(queryResult.data)

    if (result.isFailure) {
      if (result.error instanceof ValidationException) {
        return NextResponse.json(
          { error: result.error.message, details: result.error.errors },
          { status: 400 }
        )
      }
      throw result.error
    }

    return ok({
      success: true,
      data: result.value.projects,
      meta: {
        total: result.value.total,
        page: result.value.page,
        pageSize: result.value.pageSize,
        totalPages: result.value.totalPages,
      },
    })
  } catch (e: any) {
    console.error('GET /api/projects error:', e)
    return serverError('Failed to load projects', e.message)
  }
}

export async function POST(req: NextRequest) {
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
    const auth = await authorizeApi('project.create')
    if (auth.error) return auth.error

    // Validation
    const bodyResult = await validateBody(req, CreateProjectSchema)
    if (!bodyResult.success) return bodyResult.error

    // Execute use case
    const useCase = new CreateProjectUseCase(projectRepository)
    const result = await useCase.execute({
      ...bodyResult.data,
      userId: auth.user.id,
    })

    if (result.isFailure) {
      if (result.error instanceof ValidationException) {
        return NextResponse.json(
          { error: result.error.message, details: result.error.errors },
          { status: 400 }
        )
      }
      if (result.error instanceof DomainException) {
        return NextResponse.json(
          { error: result.error.message, code: result.error.code },
          { status: 400 }
        )
      }
      throw result.error
    }

    return ok(
      { success: true, data: result.value },
      { status: 201 }
    )
  } catch (e: any) {
    console.error('POST /api/projects error:', e)
    return serverError('Failed to create project', e.message)
  }
}
