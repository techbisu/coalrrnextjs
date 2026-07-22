import { NextResponse } from 'next/server'
import { authorizeApi } from '@/authorization/middleware/authorize'
import { ok, badRequest, notFound, serverError } from '../../../../_lib'
import type { NextRequest } from 'next/server'
import { approveFormXXIIUseCase } from '@/infrastructure/di/Container'
import { validateBody } from '@/application/middleware/validation'
import { ApproveFormXXIISchema } from '@/application/validators/schemas'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const auth = await authorizeApi('project.lock') // maybe a different permission later
    if (auth.error) return auth.error

    const { id } = await ctx.params
    const bodyResult = await validateBody(req, ApproveFormXXIISchema)
    if (!bodyResult.success) return bodyResult.error

    const { approvedAreaAcres, approvedJobs, approvalDate, approvalRefNo, docId, mouzaLgds } = bodyResult.data

    const result = await approveFormXXIIUseCase!.execute({
      projectId: id,
      approvedAreaAcres,
      approvedJobs,
      approvalDate: new Date(approvalDate),
      approvalRefNo,
      docId,
      mouzaLgds: mouzaLgds ? mouzaLgds.map((m: string) => BigInt(m)) : [],
      userId: auth.user.id,
    })

    if (result.isFailure) {
      return badRequest(String(result.error))
    }

    return ok({
      success: true,
      message: 'Form-XXII deviation approved successfully',
    })
  } catch (e: any) {
    console.error('POST /api/projects/[id]/form-xxii/approve error:', e)
    return serverError('Failed to approve Form-XXII', e.message)
  }
}
