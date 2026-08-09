import { MODULE_CODES } from '@/core/config/module-codes.config'
import { authorizeApi } from '@/authorization/middleware/authorize'
import { ok, badRequest, serverError, readJson } from '../../../_lib'
import { getCurrentUser } from '@/lib/auth'
import type { NextRequest } from 'next/server'
import { UpdateChecklistItemUseCase } from '@/application/use-cases/proposal'
import { PrismaProposalRepository } from '@/infrastructure/persistence/repositories'
import { db } from '@/lib/db'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params
    const mandatoryRules = await db.checklist_requirement_rule.findMany({
      where: { module_code: { in: [MODULE_CODES.LAND_SCHEDULE, 'LAND_ACQ_PROPOSAL', 'LAND_SCHEDULE'] }, is_mandatory: true, is_active: true }
    })

    const submissions = await db.checklist_submission.findMany({
      where: {
        checkable_id: id,
        status: { in: ['COMPLETED', 'SUBMITTED', 'APPROVED'] }
      }
    })

    const completedReqIds = new Set(submissions.map(s => s.requirement_id))
    const missingRules = mandatoryRules.filter(r => !completedReqIds.has((r as any).chk_id || (r as any).id))
    const isComplete = missingRules.length === 0

    return ok({
      isComplete,
      completedCount: completedReqIds.size,
      mandatoryCount: mandatoryRules.length,
      missingItems: missingRules.map(r => r.title)
    })
  } catch (e) {
    return serverError('Failed to fetch checklist status', e instanceof Error ? e.message : String(e))
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const auth = await authorizeApi('acquisition.edit')
    if (auth.error) return auth.error

    const user = await getCurrentUser()
    if (!user) return badRequest('user not found')

    const { id } = await ctx.params
    const body = await readJson<{ itemKey: string; status: 'pending' | 'in_progress' | 'complete' | 'not_applicable' }>(req)
    if (!body?.itemKey || !body.status) return badRequest('itemKey and status required')

    const proposalRepo = new PrismaProposalRepository()
    const useCase = new UpdateChecklistItemUseCase(proposalRepo)

    const result = await useCase.execute({
      proposalId: id,
      itemKey: body.itemKey,
      status: body.status,
      user_id: user.id.toString()
    })

    if (result.isFailure) {
      return badRequest(String(result.error) || 'Failed to update checklist')
    }

    return ok(result.value)
  } catch (e) {
    return serverError('Failed to update checklist', e instanceof Error ? e.message : String(e))
  }
}
