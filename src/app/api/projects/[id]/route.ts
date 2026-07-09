import { NextResponse } from 'next/server'
import { authorizeApi } from '@/authorization/middleware/authorize'
import { ProjectService } from '@/modules/project-master/services/ProjectService'
import { ok, badRequest, serverError, notFound } from '../../_lib'
import type { NextRequest } from 'next/server'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const auth = await authorizeApi('project.edit')
    if (auth.error) return auth.error

    const { id } = await ctx.params
    const body = await req.json()
    if (!body) return badRequest('Invalid body')

    const updated = await ProjectService.updateProject(id, body, auth.user.id)
    return ok({ id: updated.id, name: updated.name, message: 'Project updated.' })
  } catch (e: any) {
    if (e.message === 'Project not found') return notFound(e.message)
    if (e.message.includes('locked')) return badRequest(e.message)
    return serverError('Failed to update project', e.message)
  }
}
