// GET /api/paf — List PAF census records with optional filters
// POST /api/paf — Create a new PAF record
import { db } from '@/lib/db'
import { ok, badRequest, serverError, readJson } from '../_lib'
import type { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const where: Record<string, unknown> = {}
    if (sp.get('categoryOfEntitlement')) where.categoryOfEntitlement = sp.get('categoryOfEntitlement')!
    if (sp.get('scStObcCategory')) where.scStObcCategory = sp.get('scStObcCategory')!

    const records = await db.pafCensusRecord.findMany({
      where,
      include: { plot: { include: { mouza: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return ok(records.map((r) => ({
      id: r.id,
      pafId: r.pafId,
      claimantName: r.claimantName,
      categoryOfEntitlement: r.categoryOfEntitlement,
      scStObcCategory: r.scStObcCategory,
      plotId: r.plotId,
      plotNumber: r.plot?.plotNumber ?? null,
      mouza: r.plot?.mouza?.name ?? null,
      photoIdentityCardDoc: r.photoIdentityCardDoc,
      createdAt: r.createdAt.toISOString(),
    })))
  } catch (e) {
    return serverError('Failed to load PAF records', e instanceof Error ? e.message : String(e))
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await readJson<{
      claimantName?: string
      categoryOfEntitlement?: string
      scStObcCategory?: string
      plotId?: string
    }>(req)
    if (!body?.claimantName || !body?.categoryOfEntitlement) {
      return badRequest('claimantName and categoryOfEntitlement are required')
    }

    const count = await db.pafCensusRecord.count()
    const pafId = `PAF-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`

    const record = await db.pafCensusRecord.create({
      data: {
        pafId,
        claimantName: body.claimantName,
        categoryOfEntitlement: body.categoryOfEntitlement,
        scStObcCategory: body.scStObcCategory ?? null,
        plotId: body.plotId ?? null,
      },
      include: { plot: { include: { mouza: true } } },
    })

    return ok({
      id: record.id,
      pafId: record.pafId,
      claimantName: record.claimantName,
      categoryOfEntitlement: record.categoryOfEntitlement,
      scStObcCategory: record.scStObcCategory,
      plotId: record.plotId,
      plotNumber: record.plot?.plotNumber ?? null,
      mouza: record.plot?.mouza?.name ?? null,
      photoIdentityCardDoc: record.photoIdentityCardDoc,
      createdAt: record.createdAt.toISOString(),
    })
  } catch (e) {
    return serverError('Failed to create PAF record', e instanceof Error ? e.message : String(e))
  }
}