import { NextRequest } from 'next/server'
import { authorizeApi } from '@/core/authorization/middleware/authorize'
import { ok, badRequest, serverError } from '@/app/api/_lib'
import { updateChecklistSubmissionUseCase } from '@/infrastructure/di/Container'
import { ACQ_LAND_SCHEDULE, MODULE_CODES } from '@/core/config/module-codes.config'

type Ctx = { params: Promise<{ id: string; requirementId: string }> }

const MODULE_CODE = MODULE_CODES.LAND_SCHEDULE
const CHECKABLE_TYPE = ACQ_LAND_SCHEDULE

export async function POST(req: NextRequest, { params }: Ctx) {
  const auth = await authorizeApi('proposal.edit')
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
