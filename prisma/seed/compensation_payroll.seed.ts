import type { PrismaClient } from '@prisma/client'

export async function seedCompensationPayroll(db: PrismaClient) {
  console.log('🌱 Seeding compensation_payroll...')

  const project = await db.mst_project.findFirst()
  if (!project) {
    console.log('Skipping compensation_payroll seed, no project found')
    return
  }
  
  const existing = await db.compensation_payroll.findFirst({ where: { payroll_code: 'PR-2026-0412' } })
  if (existing) return

  const payrollLines = [
    { name: 'Ramesh Kumar Sahoo', plot: 'P-101', land_value: '3125000.00', asset_value: '450000.00', years: 2 },
    { name: 'Sita Devi Mohanty', plot: 'P-102', land_value: '2062500.00', asset_value: '280000.00', years: 2 },
    { name: 'Bhagirathi Behera', plot: 'P-103', land_value: '3937500.00', asset_value: '520000.00', years: 2 },
    { name: 'Anjali Pradhan', plot: 'P-104', land_value: '1500000.00', asset_value: '180000.00', years: 1 },
  ]

  let batchTotal = 0
  const payroll = await db.compensation_payroll.create({
    data: {
      project_id: project.id,
      payroll_code: 'PR-2026-0412',
      multiplication_factor: '1.0000',
      state: 'HqParallelVetting',
      landowner_count: payrollLines.length,
      total_award: '0.00',
    },
  })

  for (const line of payrollLines) {
    const land = parseFloat(line.land_value)
    const asset = parseFloat(line.asset_value)
    const base = land + asset
    const solatium = base * 1.0
    const escalation = land * 0.12 * line.years
    const total = base + solatium + escalation
    batchTotal += total

    await db.compensation_payroll_line.create({
      data: {
        payroll_id: payroll.id,
        landowner_name: line.name,
        plot_reference: line.plot,
        land_value: line.land_value,
        asset_value: line.asset_value,
        solatium_amount: solatium.toFixed(2),
        escalation_amount: escalation.toFixed(2),
        total_award: total.toFixed(2),
        years_since_notification: line.years,
        formula_snapshot: JSON.stringify({
          calculator: 'LandCompensationEngine',
          version: '1.0',
          inputs: { land_value: line.land_value, asset_value: line.asset_value, years_since_notification: line.years, solatiumRate: '1.00', escalationRate: '0.12' },
          breakdown: { base: base.toFixed(2), solatium: solatium.toFixed(2), escalation: escalation.toFixed(2) },
          output: total.toFixed(2),
        }),
      },
    })
  }

  await db.compensation_payroll.update({ where: { id: payroll.id }, data: { total_award: batchTotal.toFixed(2) } })
}
