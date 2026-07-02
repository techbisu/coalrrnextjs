// PATCH /api/projects/[id] — edit a draft project (only when unlocked)
import { db } from '@/lib/db'
import { ok, badRequest, notFound, serverError, readJson } from '../../_lib'
import { getCurrentUser } from '@/lib/auth'
import type { NextRequest } from 'next/server'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const user = await getCurrentUser()
    if (!user || user.portal !== 'ecl') return badRequest('Only ECL officers can edit projects')
    const { id } = await ctx.params
    const project = await db.mstProject.findUnique({ where: { id } })
    if (!project) return notFound('Project not found')
    if (project.lockedAt) return badRequest('Baseline is locked — cannot edit.')
    const body = await readJson<{ name?: string; collieryCode?: string; totalLandLimitAcres?: string; totalBudgetCeiling?: string; totalEmploymentQuota?: number; boundary?: string; statutoryClearances?: string }>(req)
    if (!body) return badRequest('Invalid body')
    const updated = await db.mstProject.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.collieryCode !== undefined && { collieryCode: body.collieryCode }),
        ...(body.totalLandLimitAcres !== undefined && { totalLandLimitAcres: body.totalLandLimitAcres }),
        ...(body.totalBudgetCeiling !== undefined && { totalBudgetCeiling: body.totalBudgetCeiling }),
        ...(body.totalEmploymentQuota !== undefined && { totalEmploymentQuota: body.totalEmploymentQuota }),
        ...(body.boundary !== undefined && { boundary: body.boundary }),
        ...(body.statutoryClearances !== undefined && { statutoryClearances: body.statutoryClearances }),
      },
    })
    return ok({ id: updated.id, name: updated.name, message: 'Project updated.' })
  } catch (e) {
    return serverError('Failed to update project', e instanceof Error ? e.message : String(e))
  }
}
