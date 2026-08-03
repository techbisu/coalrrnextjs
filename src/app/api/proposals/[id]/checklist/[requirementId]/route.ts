import { NextRequest } from 'next/server'
import { authorizeApi } from '@/core/authorization/middleware/authorize'
import { ok, badRequest, serverError } from '@/app/api/_lib'
import { updateChecklistSubmissionUseCase } from '@/infrastructure/di/Container'

type Ctx = { params: Promise<{ id: string; requirementId: string }> }

const MODULE_CODE = 'LAND_ACQ_PROPOSAL'
const CHECKABLE_TYPE = 'land_schedule'

export async function POST(req: NextRequest, { params }: Ctx) {
  const auth = await authorizeApi('proposal.update')
  if (auth.error) return auth.error

  const { id, requirementId } = await params

  try {
    const body = await req.json().catch(() => ({}))

    const result = await updateChecklistSubmissionUseCase.execute({
      moduleCode: MODULE_CODE,
      requirementId,
      checkableType: CHECKABLE_TYPE,
      checkableId: id,
      documentId: body.documentId,
      userInput: body.userInput,
      userId: auth.user.id,
    })

    if (result.isFailure) return badRequest(String(result.error))

    return ok({ success: true, data: result.value })
  } catch (e: any) {
    console.error('POST /api/proposals/[id]/checklist/[requirementId] error:', e)
    return serverError('Failed to update checklist item', e.message)
  }
}
