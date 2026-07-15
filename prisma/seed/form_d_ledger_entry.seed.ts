import type { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'

export async function seedFormDLedgerEntry(db: PrismaClient) {
  console.log('🌱 Seeding form_d_ledger_entry...')

  const project = await db.mst_project.findFirst()
  const plots = await db.mst_plot.findMany()

  if (!project || plots.length < 2) return

  const ledgerRows = [
    { plot_id: plots[0].id, amount_land: '3125000.00', amount_rnr: '450000.00', payee: 'Ramesh Kumar Sahoo', utr: 'UTR8823419012', daysAgo: 5 },
    { plot_id: plots[1].id, amount_land: '2062500.00', amount_rnr: '280000.00', payee: 'Sita Devi Mohanty', utr: 'UTR8823419013', daysAgo: 4 },
  ]
  
  const existing = await db.form_d_ledger_entry.findFirst()
  if (existing) return

  let prevHash: string | null = null
  for (const row of ledgerRows) {
    const canonical = `${row.plot_id}|${row.amount_land}|${row.amount_rnr}|${row.payee}|${row.utr}|${prevHash ?? 'GENESIS'}`
    const row_hash = createHash('sha256').update(canonical).digest('hex')
    await db.form_d_ledger_entry.create({
      data: {
        project_id: project.id,
        plot_id: row.plot_id,
        amount_land: row.amount_land,
        amount_rnr: row.amount_rnr,
        payee_type: 'individual',
        payee_name: row.payee,
        rtgs_utr_reference: row.utr,
        row_hash,
        previous_hash: prevHash,
        paid_at: new Date(Date.now() - row.daysAgo * 86400000),
        state: 'approved',
      },
    })
    prevHash = row_hash
  }
}
