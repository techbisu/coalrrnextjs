import { NextResponse } from 'next/server'
import { authorizeApi } from '@/authorization/middleware/authorize'
import { UpdateProjectUseCase } from '@/application/use-cases/project'
import { PrismaProjectRepository } from '@/infrastructure/persistence/repositories/PrismaProjectRepository'
import { ok, badRequest, serverError, notFound } from '../../_lib'
import type { NextRequest } from 'next/server'
import { NotFoundException, ValidationException } from '@/core/errors'
import { ProjectAlreadyLockedException } from '@/domain'

type Ctx = { params: Promise<{ id: string }> }

const projectRepository = new PrismaProjectRepository()

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const auth = await authorizeApi('project.edit')
    if (auth.error) return auth.error

    const { id } = await ctx.params
    const body = await req.json()
    if (!body) return badRequest('Invalid body')

    const useCase = new UpdateProjectUseCase(projectRepository)
    const result = await useCase.execute({
      ...body,
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
