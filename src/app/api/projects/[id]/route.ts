import { NextResponse } from 'next/server'
import { authorizeApi } from '@/core/authorization/middleware/authorize'
import {
  getProjectDetailUseCase,
  updateProjectUseCase,
  deleteProjectUseCase
} from '@/infrastructure/di/Container'
import { ok, badRequest, serverError, notFound } from '../../_lib'
import type { NextRequest } from 'next/server'
import { NotFoundException, ValidationException } from '@/core/errors'
import { ProjectAlreadyLockedException } from '@/domain'
import { validateBody } from '@/application/middleware/validation'
import { UpdateProjectSchema } from '@/application/validators/schemas'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const auth = await authorizeApi('project.view')
    if (auth.error) return auth.error

    const { id } = await ctx.params
    const result = await getProjectDetailUseCase.execute({ projectId: id })

    if (result.isFailure) {
      if (String(result.error).includes('not found')) return notFound(String(result.error))
      throw result.error
    }

    return ok(result.value)
  } catch (e: any) {
    return serverError('Failed to fetch project details', e.message)
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const auth = await authorizeApi('project.edit')
    if (auth.error) return auth.error

    const { id } = await ctx.params

    // Validate & coerce body — critical for bigint fields like state_lgd and mouza_lgds
    const bodyResult = await validateBody(req, UpdateProjectSchema)
    if (!bodyResult.success) return bodyResult.error

    const result = await updateProjectUseCase.execute({
      ...bodyResult.data,
      id,
      user_id: auth.user.id
    })

    if (result.isFailure) {
      if ((result.error as any) instanceof NotFoundException || String(result.error).includes('not found')) return notFound(String(result.error))
      if ((result.error as any) instanceof ProjectAlreadyLockedException) return badRequest(String(result.error))
      if ((result.error as any) instanceof ValidationException) {
        return NextResponse.json(
          { error: String(result.error), details: (result.error as any) },
          { status: 400 }
        )
      }
      throw result.error
    }

    return ok(result.value)
  } catch (e: any) {
    return serverError('Failed to update project', e.message)
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    const auth = await authorizeApi('project.delete')
    if (auth.error) return auth.error

    const { id } = await ctx.params

    const result = await deleteProjectUseCase.execute({
      id,
      user_id: auth.user.id
    })

    if (result.isFailure) {
      if ((result.error as any) instanceof NotFoundException || String(result.error).includes('not found')) return notFound(String(result.error))
      if ((result.error as any) instanceof ProjectAlreadyLockedException || String(result.error).includes('locked')) return badRequest(String(result.error))
      throw result.error
    }

    return ok(result.value)
  } catch (e: any) {
    return serverError('Failed to delete project', e.message)
  }
}
