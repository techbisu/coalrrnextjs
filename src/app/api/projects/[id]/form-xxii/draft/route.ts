import { NextResponse } from 'next/server'
import { authorizeApi } from '@/authorization/middleware/authorize'
import { ok, badRequest, notFound, serverError } from '../../../../_lib'
import type { NextRequest } from 'next/server'
import { generateFormXXIIUseCase } from '@/infrastructure/di/Container'
import { validateBody } from '@/application/middleware/validation'
import { GenerateFormXXIISchema } from '@/application/validators/schemas'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const auth = await authorizeApi('project.view')
    if (auth.error) return auth.error

    const { id } = await ctx.params
    const bodyResult = await validateBody(req, GenerateFormXXIISchema)
    if (!bodyResult.success) return bodyResult.error

    const { proposedAreaAcres, proposedJobs } = bodyResult.data

    const result = await generateFormXXIIUseCase!.execute({
      projectId: id,
      proposedAreaAcres,
      proposedBudgetINR: 0,
      proposedJobs,
    })

    if (result.isFailure) {
      return badRequest(String(result.error))
    }

    return ok({
      success: true,
      data: result.value,
    })
  } catch (e: any) {
    console.error('POST /api/projects/[id]/form-xxii/draft error:', e)
    return serverError('Failed to generate draft', e.message)
  }
}
