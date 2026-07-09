import { db } from '@/lib/db'
import { ok, serverError, dec } from '../_lib'
import type { NextRequest } from 'next/server'

export async function GET() {
  try {
    const pools = await db.nomineePool.findMany({
      include: {
        _count: {
          select: { contributions: true }
        },
        employmentApplications: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return ok(pools.map((p) => {
      const pooledAcres = Number(p.pooledAcreage)
      const hasCrossedThreshold = pooledAcres >= 2.0
      let status = 'Pooling'
      if (p.employmentApplications.length > 0) status = 'Application Submitted'
      else if (hasCrossedThreshold) status = 'Threshold Met'

      return {
        id: p.id,
        nomineeName: p.nomineeName,
        nomineeAadhaarHash: p.nomineeAadhaarHash,
        pooledAcreage: dec(p.pooledAcreage),
        contributionCount: p._count.contributions,
        status,
        threshold: '2.0',
        hasCrossedThreshold,
        createdAt: p.createdAt.toISOString()
      }
    }))
  } catch (e) {
    return serverError('Failed to load nominee pools', e instanceof Error ? e.message : String(e))
  }
}
