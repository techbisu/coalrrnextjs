// GET/PATCH/DELETE /api/paf/[id]
import { db } from '@/lib/db'
import { ok, notFound, badRequest, serverError, readJson } from '../../_lib'
import type { NextRequest } from 'next/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const r = await db.pafCensusRecord.findUnique({
      where: { id },
      include: { plot: { include: { mouza: true } } },
    })
    if (!r) return notFound('PAF record not found')
    return ok({
      id: r.id, pafId: r.pafId, claimantName: r.claimantName,
      categoryOfEntitlement: r.categoryOfEntitlement, scStObcCategory: r.scStObcCategory,
      plotId: r.plotId, plotNumber: r.plot?.plotNumber ?? null,
      mouza: r.plot?.mouza?.name ?? null, photoIdentityCardDoc: r.photoIdentityCardDoc,
      createdAt: r.createdAt.toISOString(),
    })
  } catch (e) {
    return serverError('Failed to load PAF record', e instanceof Error ? e.message : String(e))
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await readJson<Record<string, unknown>>(req)
    if (!body) return badRequest('Invalid body')

    const record = await db.pafCensusRecord.update({
      where: { id },
      data: {
        ...(body.claimantName && { claimantName: String(body.claimantName) }),
        ...(body.categoryOfEntitlement && { categoryOfEntitlement: String(body.categoryOfEntitlement) }),
        ...(body.scStObcCategory !== undefined && { scStObcCategory: body.scStObcCategory ? String(body.scStObcCategory) : null }),
        ...(body.plotId !== undefined && { plotId: body.plotId ? String(body.plotId) : null }),
        ...(body.photoIdentityCardDoc !== undefined && { photoIdentityCardDoc: body.photoIdentityCardDoc ? String(body.photoIdentityCardDoc) : null }),
      },
      include: { plot: { include: { mouza: true } } },
    })
    return ok({ id: record.id, pafId: record.pafId, claimantName: record.claimantName, categoryOfEntitlement: record.categoryOfEntitlement, scStObcCategory: record.scStObcCategory, plotId: record.plotId, photoIdentityCardDoc: record.photoIdentityCardDoc, createdAt: record.createdAt.toISOString() })
  } catch (e) {
    return serverError('Failed to update PAF record', e instanceof Error ? e.message : String(e))
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.pafCensusRecord.delete({ where: { id } })
    return ok({ deleted: true })
  } catch (e) {
    return serverError('Failed to delete PAF record', e instanceof Error ? e.message : String(e))
  }
}