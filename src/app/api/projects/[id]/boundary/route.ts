import { NextResponse } from 'next/server'
import { authorizeApi } from '@/authorization/middleware/authorize'
import { db } from '@/lib/db'
import { ok, serverError, notFound, badRequest } from '../../../_lib'
import type { NextRequest } from 'next/server'
import { z } from 'zod'

type Ctx = { params: Promise<{ id: string }> }

const BoundarySchema = z.object({
  boundary: z.string().min(1, 'Boundary cannot be empty'),
})

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const auth = await authorizeApi('project.edit')
    if (auth.error) return auth.error

    const { id } = await ctx.params

    const body = await req.json()
    const parsed = BoundarySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    // Check project exists
    const project = await db.project.findUnique({ where: { projCd: id }, select: { projCd: true, status: true } })
    if (!project) return notFound('Project not found')
    if (project.status === 1) return badRequest('Cannot edit a locked baseline')

    // Direct Prisma update — boundary is pure metadata, does not touch domain logic
    await db.project.update({
      where: { projCd: id },
      data: {
        boundary: parsed.data.boundary,
        updtTs: BigInt(Math.floor(Date.now() / 1000)),
      },
    })

    return ok({ message: 'Boundary saved successfully.' })
  } catch (e: any) {
    return serverError('Failed to save boundary', e.message)
  }
}
