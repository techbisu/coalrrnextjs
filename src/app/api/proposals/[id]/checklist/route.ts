import { NextRequest } from 'next/server'
import { authorizeApi } from '@/core/authorization/middleware/authorize'
import { ok, badRequest, notFound, serverError } from '@/app/api/_lib'
import { getChecklistStatusUseCase } from '@/infrastructure/di/Container'
import { ACQ_LAND_SCHEDULE, MODULE_CODES } from '@/core/config/module-codes.config'

type Ctx = { params: Promise<{ id: string }> }

const MODULE_CODE = MODULE_CODES.LAND_SCHEDULE
const CHECKABLE_TYPE = ACQ_LAND_SCHEDULE

export async function GET(req: NextRequest, { params }: Ctx) {
  const auth = await authorizeApi('proposal.view')
  if (auth.error) return auth.error

  const { id } = await params

  try {
    const result = await getChecklistStatusUseCase.execute({
      moduleCode: MODULE_CODE,
      checkableType: CHECKABLE_TYPE,
      checkableId: id,
    })

    if (result.isFailure) return badRequest(String(result.error))

    return ok(result.value)
  } catch (e: any) {
    console.error('GET /api/proposals/[id]/checklist error:', e)
    return serverError('Failed to fetch checklist', e.message)
  }
}
