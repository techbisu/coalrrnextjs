// POST /api/projects/[id]/lock — one-shot baseline lock
import { db } from '@/lib/db'
import { ok, badRequest, notFound, serverError, readJson } from '../../../_lib'
import { getCurrentUser } from '@/lib/auth'
import type { NextRequest } from 'next/server'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const user = await getCurrentUser()
    if (!user || user.portal !== 'ecl' || (user.role !== 'area_office' && user.role !== 'cmd'))
      return badRequest('Only Area Office or CMD can lock the baseline')
    const { id } = await ctx.params
    const body = await readJson<{ confirmName?: string }>(req)
    if (!body?.confirmName) return badRequest('Confirmation required: type the project name to confirm')
    const project = await db.mstProject.findUnique({ where: { id } })
    if (!project) return notFound('Project not found')
    if (project.lockedAt) return badRequest('Baseline already locked')
    if (body.confirmName !== project.name) return badRequest(`Confirmation name does not match "${project.name}"`)
    const updated = await db.mstProject.update({ where: { id }, data: { lockedAt: new Date() } })
    return ok({ id: updated.id, lockedAt: updated.lockedAt!.toISOString(), message: `Baseline LOCKED for "${updated.name}".` })
  } catch (e) {
    return serverError('Failed to lock baseline', e instanceof Error ? e.message : String(e))
  }
}
