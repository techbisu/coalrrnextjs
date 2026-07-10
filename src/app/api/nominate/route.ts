import { db } from '@/lib/db'
import { ok, badRequest, serverError, readJson } from '../_lib'
import type { NextRequest } from 'next/server'
import { Decimal } from 'decimal.js'

export async function POST(req: NextRequest) {
  try {
    const body = await readJson<{
      nominee_aadhaar_hash?: string
      nominee_name?: string
      relationship?: string
      claimId?: string
      share_acres?: string
    }>(req)

    if (!body?.nominee_aadhaar_hash || !body.nominee_name || !body.claimId || !body.share_acres) {
      return badRequest('nominee_aadhaar_hash, nominee_name, claimId, share_acres required')
    }

    const claim = await db.form_i_claim.findUnique({ where: { id: body.claimId } })
    if (!claim) return badRequest('Claim not found')

    const share_acres = new Decimal(body.share_acres)
    if (share_acres.lte(0)) return badRequest('Share acres must be greater than 0')
    if (share_acres.gt(new Decimal(claim.own_share_acres as any))) return badRequest('Cannot contribute more than own share')

    // Start a transaction to create/update the pool and add contribution
    const result = await db.$transaction(async (tx) => {
      let pool = await tx.nominee_pool.findUnique({
        where: { nominee_aadhaar_hash: body.nominee_aadhaar_hash! }
      })

      if (!pool) {
        pool = await tx.nominee_pool.create({
          data: {
            nominee_aadhaar_hash: body.nominee_aadhaar_hash!,
            nominee_name: body.nominee_name!,
            pooled_acreage: 0,
          }
        })
      }

      // Check if this claim is already contributed to this pool
      const existingContrib = await tx.nominee_pool_contribution.findUnique({
        where: {
          pool_id_form_i_claim_id: {
            pool_id: pool.id,
            form_i_claim_id: claim.id
          }
        }
      })

      if (existingContrib) {
        throw new Error('This claim has already contributed to this nominee pool')
      }

      // Create contribution
      const contrib = await tx.nominee_pool_contribution.create({
        data: {
          pool_id: pool.id,
          form_i_claim_id: claim.id,
          share_acres: share_acres.toString()
        }
      })

      // Update pooled acreage
      const newPooledAcreage = new Decimal(pool.pooled_acreage as any).plus(share_acres)
      pool = await tx.nominee_pool.update({
        where: { id: pool.id },
        data: {
          pooled_acreage: newPooledAcreage.toString(),
          apply_button_unlocked: newPooledAcreage.gte(2.0)
        }
      })

      // Update claim state if needed
      await tx.form_i_claim.update({
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
