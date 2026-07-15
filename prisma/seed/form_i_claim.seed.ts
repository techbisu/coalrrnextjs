import type { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'

export async function seedFormIClaim(db: PrismaClient) {
  console.log('🌱 Seeding form_i_claim...')

  const plots = await db.mst_plot.findMany()
  if (plots.length < 4) {
    console.log('Skipping form_i_claim seed, not enough plots found')
    return
  }

  const hashAadhaar = (n: string) => createHash('sha256').update(n).digest('hex').slice(0, 16)
  const claimsData = [
    { plot_id: plots[0].id, aadhaar: '1234-5678-9012', name: 'Ramesh Kumar Sahoo', share: '12.5000', optEmp: true, bank: 'SBIN0001234', ifsc: 'SBIN0001234', state: 'Published', submittedDaysAgo: 25 },
    { plot_id: plots[1].id, aadhaar: '2345-6789-0123', name: 'Sita Devi Mohanty', share: '8.2500', optEmp: false, bank: 'ICIC0005678', ifsc: 'ICIC0005678', state: 'TransparencyWindow', submittedDaysAgo: 8 },
    { plot_id: plots[2].id, aadhaar: '3456-7890-1234', name: 'Bhagirathi Behera', share: '15.7500', optEmp: true, bank: 'PUNB0009012', ifsc: 'PUNB0009012', state: 'TitleScrutiny', submittedDaysAgo: 3 },
    { plot_id: plots[3].id, aadhaar: '4567-8901-2345', name: 'Anjali Pradhan', share: '6.0000', optEmp: true, bank: 'UBIN0003456', ifsc: 'UBIN0003456', state: 'Drafting', submittedDaysAgo: 0 },
  ]

  for (const c of claimsData) {
    const submitted_at = c.submittedDaysAgo > 0 ? new Date(Date.now() - c.submittedDaysAgo * 86400000) : null
    const twEnds = submitted_at ? new Date(submitted_at.getTime() + 21 * 86400000) : null
    
    // Check if exists
    const existing = await db.form_i_claim.findFirst({
      where: { claim_code: `FORM1-2026-${String(claimsData.indexOf(c) + 1).padStart(4, '0')}` }
    })
    
    if (!existing) {
      await db.form_i_claim.create({
        data: {
          claim_code: `FORM1-2026-${String(claimsData.indexOf(c) + 1).padStart(4, '0')}`,
          plot_id: c.plot_id,
          citizen_id_hash: hashAadhaar(c.aadhaar),
          claimant_name: c.name,
          own_share_acres: c.share,
          opted_monetary_in_lieu_of_employment: !c.optEmp,
          bank_account_number: c.bank,
          bank_ifsc: c.ifsc,
          state: c.state,
          submitted_at,
          transparency_window_ends_at: twEnds,
        },
      })
    }
  }
}
