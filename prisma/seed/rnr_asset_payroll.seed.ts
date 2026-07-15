import type { PrismaClient } from '@prisma/client'

export async function seedRnrAssetPayroll(db: PrismaClient) {
  console.log('🌱 Seeding rnr_asset_payroll...')

  const project = await db.mst_project.findFirst()
  const claims = await db.form_i_claim.findMany()

  if (!project || claims.length < 4) return

  const existing = await db.rnr_asset_payroll.findFirst({ where: { payroll_code: 'RNR-2025-0001' } })
  if (existing) return

  const rnr = await db.rnr_asset_payroll.create({
    data: {
      project_id: project.id,
      payroll_code: 'RNR-2025-0001',
      state: 'Approved',
      total_value: '775000.00',
    },
  })
  
  const rnrLines = [
    { name: claims[0].claimant_name, type: 'homestead', amount: '350000.00', ref: 'PWD-RR-2025-HS-001' },
    { name: claims[1].claimant_name, type: 'shifting_allowance', amount: '50000.00', ref: 'PWD-RR-2025-SA-001' },
    { name: claims[2].claimant_name, type: 'homestead', amount: '350000.00', ref: 'PWD-RR-2025-HS-001' },
    { name: claims[3].claimant_name, type: 'cattle_shed', amount: '75000.00', ref: 'PWD-RR-2025-CS-001' },
  ]
  
  for (const l of rnrLines) {
    await db.rnr_asset_payroll_line.create({
      data: { payroll_id: rnr.id, beneficiary_name: l.name, entitlement_type: l.type, valuation_amount: l.amount, pwd_rate_reference: l.ref, formula_snapshot: JSON.stringify({ rate: l.amount }) },
    })
  }
}
