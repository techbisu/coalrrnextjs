// GET /api/ledger — list Form-D ledger entries (immutable, hash-chained)
// POST /api/ledger — add a new ledger entry (computes hash chain; spec §3.2.4)
import { db } from '@/lib/db'
import { ok, badRequest, serverError, dec, readJson } from '../_lib'
import { createHash } from 'crypto'
import type { NextRequest } from 'next/server'

export async function GET() {
  try {
    const entries = await db.formDLedgerEntry.findMany({
      orderBy: { paidAt: 'desc' },
      include: { plot: { include: { mouza: true } } },
    })
    return ok(entries.map((e) => ({
      id: e.id,
      plotId: e.plotId,
      plotNumber: e.plot?.plotNumber,
      mouza: e.plot?.mouza.name,
      amountLand: dec(e.amountLand),
      amountRnr: dec(e.amountRnr),
      payeeType: e.payeeType,
      payeeName: e.payeeName,
      rtgsUtrReference: e.rtgsUtrReference,
      rowHash: e.rowHash,
      previousHash: e.previousHash,
      state: e.state,
      paidAt: e.paidAt.toISOString(),
      isImmutable: e.rowHash !== null,
    })))
  } catch (e) {
    return serverError('Failed to load ledger', e instanceof Error ? e.message : String(e))
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await readJson<{
      projectId?: string
      plotId?: string
      amountLand?: string
      amountRnr?: string
      payeeName?: string
      rtgsUtrReference?: string
    }>(req)
    if (!body?.projectId || !body.plotId || !body.amountLand || !body.amountRnr || !body.payeeName) {
      return badRequest('projectId, plotId, amountLand, amountRnr, payeeName required')
    }

    // Find previous entry to chain the hash (spec §3.2.4)
    const lastEntry = await db.formDLedgerEntry.findFirst({
      where: { projectId: body.projectId },
      orderBy: { paidAt: 'desc' },
    })
    const previousHash = lastEntry?.rowHash ?? null

    // Hash chain: sha256(canonical_row || previous_hash)
    const canonical = `${body.plotId}|${body.amountLand}|${body.amountRnr}|individual|${body.payeeName}|${body.rtgsUtrReference ?? ''}|${previousHash ?? 'GENESIS'}`
    const rowHash = createHash('sha256').update(canonical).digest('hex')

    const entry = await db.formDLedgerEntry.create({
      data: {
        projectId: body.projectId,
        plotId: body.plotId,
        amountLand: body.amountLand,
        amountRnr: body.amountRnr,
        payeeType: 'individual',
        payeeName: body.payeeName,
        rtgsUtrReference: body.rtgsUtrReference,
        rowHash,
        previousHash,
        state: 'approved',
      },
    })

    return ok({
      id: entry.id,
      rowHash: entry.rowHash,
      previousHash: entry.previousHash,
      isImmutable: true,
      message: 'Ledger entry sealed — row is now immutable (BEFORE UPDATE/DELETE trigger enforced).',
    }, { status: 201 })
  } catch (e) {
    return serverError('Failed to append ledger entry', e instanceof Error ? e.message : String(e))
  }
}
