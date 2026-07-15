import type { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'

export async function seedNomineePool(db: PrismaClient) {
  console.log('🌱 Seeding nominee_pool...')

  const claims = await db.form_i_claim.findMany()
  if (claims.length < 3) return

  const existing = await db.nominee_pool.findFirst()
  if (existing) return
  
  const hashAadhaar = (n: string) => createHash('sha256').update(n).digest('hex').slice(0, 16)

  const pool = await db.nominee_pool.create({
    data: {
      nominee_aadhaar_hash: hashAadhaar('9999-8888-7777'),
      nominee_name: 'Priyanka Sahoo (Nominee)',
      pooled_acreage: '2.2500',
      apply_button_unlocked: true,
    },
  })
  
  await db.nominee_pool_contribution.create({
    data: { pool_id: pool.id, form_i_claim_id: claims[0].id, share_acres: '1.2500' },
  })
  
  await db.nominee_pool_contribution.create({
    data: { pool_id: pool.id, form_i_claim_id: claims[2].id, share_acres: '1.0000' },
  })
}
