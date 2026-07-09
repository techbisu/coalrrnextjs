import { db } from '@/lib/db'
import { ok, notFound, serverError, dec } from '../../_lib'
import type { NextRequest } from 'next/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const pool = await db.nomineePool.findUnique({
      where: { id },
      include: {
        contributions: {
          include: {
            formIClaim: {
              include: { plot: true }
            }
          }
        },
        employmentApplications: true
      }
    })

    if (!pool) return notFound('Nominee pool not found')

    const pooledAcres = Number(pool.pooledAcreage)
    const hasCrossedThreshold = pooledAcres >= 2.0
    let status = 'Pooling'
    if (pool.employmentApplications.length > 0) status = 'Application Submitted'
    else if (hasCrossedThreshold) status = 'Threshold Met'

    return ok({
      id: pool.id,
      nomineeName: pool.nomineeName,
      nomineeAadhaarHash: pool.nomineeAadhaarHash,
      pooledAcreage: dec(pool.pooledAcreage),
      threshold: '2.0',
      hasCrossedThreshold,
      contributionCount: pool.contributions.length,
      status,
      contributions: pool.contributions.map((c) => ({
        id: c.id,
        claimantName: c.formIClaim.claimantName,
        plotNumber: c.formIClaim.plot.plotNumber,
        shareAcres: dec(c.shareAcres),
        claimCode: c.formIClaim.claimCode
      })),
      createdAt: pool.createdAt.toISOString()
    })
  } catch (e) {
    return serverError('Failed to load pool detail', e instanceof Error ? e.message : String(e))
  }
}
