import { db } from '@/lib/db'
import { ok, badRequest, notFound, serverError, readJson } from '../../_lib'
import type { NextRequest } from 'next/server'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await readJson<Record<string, unknown>>(req)
    if (!body) return badRequest('Invalid JSON')

    const app = await db.employmentApplication.findUnique({ where: { id } })
    if (!app) return notFound('Employment application not found')

    // Handle state transition or other field updates
    const data: Record<string, unknown> = {}
    if (body.state && typeof body.state === 'string') data.state = body.state
    if (body.exceptionFlags && typeof body.exceptionFlags === 'string') data.exceptionFlags = body.exceptionFlags

    const updated = await db.employmentApplication.update({
      where: { id },
      data
    })

    return ok(updated)
  } catch (e) {
    return serverError('Failed to update employment application', e instanceof Error ? e.message : String(e))
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const app = await db.employmentApplication.findUnique({
      where: { id },
      include: {
        project: true,
        nomineePool: {
          include: {
            contributions: {
              include: {
                formIClaim: {
                  include: { plot: true }
                }
              }
            }
          }
        }
      }
    })
    
    if (!app) return notFound('Employment application not found')
    return ok(app)
  } catch (e) {
    return serverError('Failed to fetch employment application', e instanceof Error ? e.message : String(e))
  }
}
