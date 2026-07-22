/**
 * Projects API - Refactored to use Clean Architecture.
 * Uses validation middleware, use cases, and proper error handling.
 */
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { authorizeApi } from '@/authorization/middleware/authorize'
import { serverError, ok } from '../_lib'
import type { NextRequest } from 'next/server'
import { validateBody, validateQuery } from '@/application/middleware/validation'
import { CreateProjectSchema, PaginationSchema } from '@/application/validators/schemas'
import { createProjectUseCase, getProjectDashboardUseCase } from '@/infrastructure/di/Container'
import { apiRateLimiter, getClientIdentifier } from '@/infrastructure/security'
import { DomainException, ValidationException } from '@/core/errors'

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
    const result = await getProjectDashboardUseCase!.execute(queryResult.data)

    if (result.isFailure) {
      if ((result.error as any) instanceof ValidationException) {
        return NextResponse.json(
          { error: String(result.error), details: (result.error as any) },
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
    const result = await createProjectUseCase!.execute({
      ...bodyResult.data,
      user_id: auth.user.id,
    })

    if (result.isFailure) {
      if ((result.error as any) instanceof ValidationException) {
        return NextResponse.json(
          { error: String(result.error), details: (result.error as any) },
          { status: 400 }
        )
      }
      if ((result.error as any) instanceof DomainException) {
        return NextResponse.json(
          { error: String(result.error), code: String(result.error) },
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
