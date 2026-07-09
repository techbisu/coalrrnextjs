// GET /api/claims — list Form-I claims
// POST /api/claims — submit a new Form-I claim (wizard final submit; spec §1.2.2 Journey B)
import { db } from '@/lib/db'
import { ok, badRequest, serverError, dec, iso, readJson } from '../_lib'
import { createHash } from 'crypto'
import type { NextRequest } from 'next/server'

export async function GET() {
  try {
    const claims = await db.formIClaim.findMany({
      include: { plot: { include: { mouza: true } } },
      orderBy: { createdAt: 'desc' },
    })
    const now = Date.now()
    return ok(claims.map((c) => {
      const twEnds = c.transparencyWindowEndsAt ? c.transparencyWindowEndsAt.getTime() : null
      const daysRemaining = twEnds ? Math.ceil((twEnds - now) / 86400000) : null
      return {
        id: c.id,
        claimCode: c.claimCode,
        claimantName: c.claimantName,
        plotId: c.plotId,
        plotNumber: c.plot.plotNumber,
        mouza: c.plot.mouza.name,
        landType: c.plot.landType,
        ownShareAcres: dec(c.ownShareAcres),
        optedMonetaryInLieuOfEmployment: c.optedMonetaryInLieuOfEmployment,
        state: c.state,
        submittedAt: iso(c.submittedAt),
        transparencyWindowEndsAt: iso(c.transparencyWindowEndsAt),
        daysRemaining,
        createdAt: c.createdAt.toISOString(),
      }
    }))
  } catch (e) {
    return serverError('Failed to load claims', e instanceof Error ? e.message : String(e))
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await readJson<{
      aadhaarNumber?: string
      claimantName?: string
      plotId?: string
      ownShareAcres?: string
      optedMonetaryInLieuOfEmployment?: boolean
      bankAccountNumber?: string
      bankIfsc?: string
    }>(req)
    if (!body?.aadhaarNumber || !body.claimantName || !body.plotId || !body.ownShareAcres) {
      return badRequest('aadhaarNumber, claimantName, plotId, ownShareAcres required')
    }

    // Layer-3 authoritative validation (spec §1.3.3)
    const plot = await db.mstPlot.findUnique({ where: { id: body.plotId } })
    if (!plot) return badRequest('Plot not found')

    if (Number(body.ownShareAcres) <= 0) return badRequest('Own share must be > 0')
    if (Number(body.ownShareAcres) > Number(plot.areaAcres)) {
      return badRequest(`Own share ${body.ownShareAcres} exceeds plot area ${plot.areaAcres}`)
    }

    const citizenIdHash = createHash('sha256').update(body.aadhaarNumber).digest('hex').slice(0, 16)

    // Idempotency: unique constraint on (citizenIdHash, plotId) — spec §3.2.1
    const existing = await db.formIClaim.findUnique({
      where: { citizenIdHash_plotId: { citizenIdHash, plotId: body.plotId } },
    })
    if (existing) return badRequest('Claim already exists for this citizen on this plot')

    const claimCode = `FORM1-${new Date().getFullYear()}-${String(Math.floor(1 + Math.random() * 9999)).padStart(4, '0')}`
    const submittedAt = new Date()
    const transparencyWindowEndsAt = new Date(submittedAt.getTime() + 21 * 86400000)

    const claim = await db.formIClaim.create({
      data: {
        claimCode,
        plotId: body.plotId,
        citizenIdHash,
        claimantName: body.claimantName,
        ownShareAcres: body.ownShareAcres,
        optedMonetaryInLieuOfEmployment: body.optedMonetaryInLieuOfEmployment ?? false,
        bankAccountNumber: body.bankAccountNumber,
        bankIfsc: body.bankIfsc,
        state: 'TitleScrutiny',
        submittedAt,
        transparencyWindowEndsAt,
      },
    })

    return ok({
      id: claim.id,
      claimCode: claim.claimCode,
      state: claim.state,
      submittedAt: claim.submittedAt!.toISOString(),
      transparencyWindowEndsAt: claim.transparencyWindowEndsAt!.toISOString(),
    }, { status: 201 })
  } catch (e) {
    return serverError('Failed to submit claim', e instanceof Error ? e.message : String(e))
  }
}
