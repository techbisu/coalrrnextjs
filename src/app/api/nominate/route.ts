import { db } from '@/lib/db'
import { ok, badRequest, serverError, readJson } from '../_lib'
import type { NextRequest } from 'next/server'
import { Decimal } from 'decimal.js'

export async function POST(req: NextRequest) {
  try {
    const body = await readJson<{
      nomineeAadhaarHash?: string
      nomineeName?: string
      relationship?: string
      claimId?: string
      shareAcres?: string
    }>(req)

    if (!body?.nomineeAadhaarHash || !body.nomineeName || !body.claimId || !body.shareAcres) {
      return badRequest('nomineeAadhaarHash, nomineeName, claimId, shareAcres required')
    }

    const claim = await db.formIClaim.findUnique({ where: { id: body.claimId } })
    if (!claim) return badRequest('Claim not found')

    const shareAcres = new Decimal(body.shareAcres)
    if (shareAcres.lte(0)) return badRequest('Share acres must be greater than 0')
    if (shareAcres.gt(new Decimal(claim.ownShareAcres as any))) return badRequest('Cannot contribute more than own share')

    // Start a transaction to create/update the pool and add contribution
    const result = await db.$transaction(async (tx) => {
      let pool = await tx.nomineePool.findUnique({
        where: { nomineeAadhaarHash: body.nomineeAadhaarHash! }
      })

      if (!pool) {
        pool = await tx.nomineePool.create({
          data: {
            nomineeAadhaarHash: body.nomineeAadhaarHash!,
            nomineeName: body.nomineeName!,
            pooledAcreage: 0,
          }
        })
      }

      // Check if this claim is already contributed to this pool
      const existingContrib = await tx.nomineePoolContribution.findUnique({
        where: {
          poolId_formIClaimId: {
            poolId: pool.id,
            formIClaimId: claim.id
          }
        }
      })

      if (existingContrib) {
        throw new Error('This claim has already contributed to this nominee pool')
      }

      // Create contribution
      const contrib = await tx.nomineePoolContribution.create({
        data: {
          poolId: pool.id,
          formIClaimId: claim.id,
          shareAcres: shareAcres.toString()
        }
      })

      // Update pooled acreage
      const newPooledAcreage = new Decimal(pool.pooledAcreage as any).plus(shareAcres)
      pool = await tx.nomineePool.update({
        where: { id: pool.id },
        data: {
          pooledAcreage: newPooledAcreage.toString(),
          applyButtonUnlocked: newPooledAcreage.gte(2.0)
        }
      })

      // Update claim state if needed
      await tx.formIClaim.update({
        where: { id: claim.id },
        data: { state: 'Nominated' }
      })

      return pool
    })

    return ok(result, { status: 201 })
  } catch (e) {
    return serverError('Failed to nominate', e instanceof Error ? e.message : String(e))
  }
}
