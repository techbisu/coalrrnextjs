// COALRR Seed Script — populates demo data across all 10 modules
import { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'

const db = new PrismaClient()

async function main() {
  console.log('🌱 Seeding COALRR demo data...')

  // Idempotent: wipe existing data first (order matters for FK constraints)
  await db.authSession.deleteMany()
  await db.user.deleteMany()
  await db.workflowReviewTask.deleteMany()
  await db.grievance.deleteMany()
  await db.employmentApplication.deleteMany()
  await db.nomineePoolContribution.deleteMany()
  await db.nomineePool.deleteMany()
  await db.formDLedgerEntry.deleteMany()
  await db.compensationPayrollLine.deleteMany()
  await db.compensationPayroll.deleteMany()
  await db.formIClaim.deleteMany()
  await db.landScheduleItem.deleteMany()
  await db.landSchedule.deleteMany()
  await db.pafCensusRecord.deleteMany()
  await db.rnrAssetPayrollLine.deleteMany()
  await db.rnrAssetPayroll.deleteMany()
  await db.document.deleteMany()
  await db.mstPlot.deleteMany()
  await db.mstMouza.deleteMany()
  await db.mstProject.deleteMany()

  // ─── AUTH: ECL officers + sample citizen ─────────────────────
  const hashPassword = (p: string) => createHash('sha256').update(p).digest('hex')
  const eclUsers = [
    { email: 'unit@coalrr.gov.in', name: 'Rajesh Kumar', role: 'unit_office', designation: 'Unit Surveyor', collieryCode: 'MCL-BHN-03' },
    { email: 'area@coalrr.gov.in', name: 'Sneha Mohanty', role: 'area_office', designation: 'Area Land Dealing Officer', collieryCode: 'MCL-ANG-01' },
    { email: 'gm.planning@coalrr.gov.in', name: 'Manoj Kumar', role: 'gm_planning', designation: 'GM (Planning)', collieryCode: 'MCL-HQ' },
    { email: 'gm.finance@coalrr.gov.in', name: 'Anita Das', role: 'gm_finance', designation: 'GM (Finance)', collieryCode: 'MCL-HQ' },
    { email: 'director@coalrr.gov.in', name: 'Prakash Rao', role: 'director', designation: 'Director (P&R)', collieryCode: 'MCL-HQ' },
    { email: 'cmd@coalrr.gov.in', name: 'Vikram Singh', role: 'cmd', designation: 'CMD', collieryCode: 'MCL-HQ' },
  ]
  for (const u of eclUsers) {
    await db.user.create({ data: { ...u, portal: 'ecl', passwordHash: hashPassword('demo1234') } })
  }
  console.log(`  ✓ ${eclUsers.length} ECL officer accounts (password: demo1234)`)

  // ─── MODULE 1: Project Master & GIS ─────────────────────────
  const project = await db.mstProject.create({
    data: {
      name: 'Bhubaneswari OCP Phase-III Expansion',
      collieryCode: 'MCL-BHN-03',
      totalLandLimitAcres: '450.0000',
      totalBudgetCeiling: '1875000000.00', // ₹187.5 Cr
      totalEmploymentQuota: 90,
      boundary: JSON.stringify({
        type: 'MultiPolygon',
        coordinates: [[[[84.05, 21.45], [84.15, 21.45], [84.15, 21.55], [84.05, 21.55], [84.05, 21.45]]]],
        color: '#16a34a',
      }),
      statutoryClearances: JSON.stringify([
        { authority: 'DGMS', referenceNo: 'DGMS/2025/4471', issuedOn: '2025-03-11' },
        { authority: 'State Environment', referenceNo: 'SEIAA-OD-2025-228', issuedOn: '2025-04-02' },
        { authority: 'Forest Dept', referenceNo: 'FD-DKL-2025-1190', issuedOn: '2025-05-18' },
      ]),
      lockedAt: new Date('2025-06-01T10:00:00Z'),
    },
  })
  console.log(`  ✓ Project: ${project.name}`)

  // ─── Master Mouza & Plots ────────────────────────────────────
  const mouza = await db.mstMouza.create({
    data: { name: 'Hingula', district: 'Angul', state: 'Odisha' },
  })
  const mouza2 = await db.mstMouza.create({
    data: { name: 'Talcher', district: 'Angul', state: 'Odisha' },
  })

  const plotData = [
    { mouzaId: mouza.id, plotNumber: 'P-101', khataNumber: 'K-44/1', landType: 'tenancy', areaAcres: '12.5000', remainingJobQuota: 3 },
    { mouzaId: mouza.id, plotNumber: 'P-102', khataNumber: 'K-44/2', landType: 'got_patta', areaAcres: '8.2500', remainingJobQuota: 2 },
    { mouzaId: mouza.id, plotNumber: 'P-103', khataNumber: 'K-45/1', landType: 'forest', areaAcres: '15.7500', remainingJobQuota: 4 },
    { mouzaId: mouza.id, plotNumber: 'P-104', khataNumber: 'K-45/2', landType: 'tenancy', areaAcres: '6.0000', remainingJobQuota: 1 },
    { mouzaId: mouza2.id, plotNumber: 'T-201', khataNumber: 'K-50/1', landType: 'tenancy', areaAcres: '22.3000', remainingJobQuota: 5 },
    { mouzaId: mouza2.id, plotNumber: 'T-202', khataNumber: 'K-50/2', landType: 'debottar', areaAcres: '4.8000', remainingJobQuota: 1 },
  ]
  const plots = await Promise.all(plotData.map(p => db.mstPlot.create({ data: p })))
  console.log(`  ✓ ${plots.length} plots across 2 mouzas`)

  // ─── MODULE 3: Form-I Claims (landowner registry) ───────────
  const hashAadhaar = (n: string) => createHash('sha256').update(n).digest('hex').slice(0, 16)
  const claimsData = [
    { plotId: plots[0].id, aadhaar: '1234-5678-9012', name: 'Ramesh Kumar Sahoo', share: '12.5000', optEmp: true, bank: 'SBIN0001234', ifsc: 'SBIN0001234', state: 'Published', submittedDaysAgo: 25 },
    { plotId: plots[1].id, aadhaar: '2345-6789-0123', name: 'Sita Devi Mohanty', share: '8.2500', optEmp: false, bank: 'ICIC0005678', ifsc: 'ICIC0005678', state: 'TransparencyWindow', submittedDaysAgo: 8 },
    { plotId: plots[2].id, aadhaar: '3456-7890-1234', name: 'Bhagirathi Behera', share: '15.7500', optEmp: true, bank: 'PUNB0009012', ifsc: 'PUNB0009012', state: 'TitleScrutiny', submittedDaysAgo: 3 },
    { plotId: plots[3].id, aadhaar: '4567-8901-2345', name: 'Anjali Pradhan', share: '6.0000', optEmp: true, bank: 'UBIN0003456', ifsc: 'UBIN0003456', state: 'Drafting', submittedDaysAgo: 0 },
  ]
  const claims = []
  for (const c of claimsData) {
    const submittedAt = c.submittedDaysAgo > 0 ? new Date(Date.now() - c.submittedDaysAgo * 86400000) : null
    const twEnds = submittedAt ? new Date(submittedAt.getTime() + 21 * 86400000) : null
    const claim = await db.formIClaim.create({
      data: {
        claimCode: `FORM1-2026-${String(claims.length + 1).padStart(4, '0')}`,
        plotId: c.plotId,
        citizenIdHash: hashAadhaar(c.aadhaar),
        claimantName: c.name,
        ownShareAcres: c.share,
        optedMonetaryInLieuOfEmployment: !c.optEmp,
        bankAccountNumber: c.bank,
        bankIfsc: c.ifsc,
        state: c.state,
        submittedAt,
        transparencyWindowEndsAt: twEnds,
      },
    })
    claims.push(claim)
  }
  console.log(`  ✓ ${claims.length} Form-I claims`)

  // ─── MODULE 4: Compensation Payroll (with calculated lines) ──
  // Per spec §2.1: Solatium = 100% of (Land + Asset); Escalation = 12% × Land × years
  const payrollLines = [
    { name: 'Ramesh Kumar Sahoo', plot: 'P-101', landValue: '3125000.00', assetValue: '450000.00', years: 2 },
    { name: 'Sita Devi Mohanty', plot: 'P-102', landValue: '2062500.00', assetValue: '280000.00', years: 2 },
    { name: 'Bhagirathi Behera', plot: 'P-103', landValue: '3937500.00', assetValue: '520000.00', years: 2 },
    { name: 'Anjali Pradhan', plot: 'P-104', landValue: '1500000.00', assetValue: '180000.00', years: 1 },
  ]
  let batchTotal = 0
  const payroll = await db.compensationPayroll.create({
    data: {
      projectId: project.id,
      payrollCode: 'PR-2026-0412',
      multiplicationFactor: '1.0000',
      state: 'HqParallelVetting',
      landownerCount: payrollLines.length,
      totalAward: '0.00',
    },
  })
  for (const line of payrollLines) {
    // Use string math (mirrors BCMath) — kept consistent with Math Engine
    const land = parseFloat(line.landValue)
    const asset = parseFloat(line.assetValue)
    const base = land + asset
    const solatium = base * 1.0
    const escalation = land * 0.12 * line.years
    const total = base + solatium + escalation
    batchTotal += total
    await db.compensationPayrollLine.create({
      data: {
        payrollId: payroll.id,
        landownerName: line.name,
        plotReference: line.plot,
        landValue: line.landValue,
        assetValue: line.assetValue,
        solatiumAmount: solatium.toFixed(2),
        escalationAmount: escalation.toFixed(2),
        totalAward: total.toFixed(2),
        yearsSinceNotification: line.years,
        formulaSnapshot: JSON.stringify({
          calculator: 'LandCompensationEngine',
          version: '1.0',
          inputs: { landValue: line.landValue, assetValue: line.assetValue, yearsSinceNotification: line.years, solatiumRate: '1.00', escalationRate: '0.12' },
          breakdown: { base: base.toFixed(2), solatium: solatium.toFixed(2), escalation: escalation.toFixed(2) },
          output: total.toFixed(2),
        }),
      },
    })
  }
  await db.compensationPayroll.update({ where: { id: payroll.id }, data: { totalAward: batchTotal.toFixed(2) } })
  console.log(`  ✓ Payroll PR-2026-0412 with ${payrollLines.length} lines, total ₹${batchTotal.toFixed(2)}`)

  // ─── MODULE 2: Land Acquisition Proposals ───────────────────
  const schedule1 = await db.landSchedule.create({
    data: {
      projectId: project.id, scheduleCode: 'SCH-2026-001', acquisitionMode: 'rfctlarr', state: 'AreaVetting',
      proposalTitle: 'Bhubaneswari OCP-III — Phase A Acquisition',
      description: 'Acquisition of 42.5 acres under RFCTLARR Act, 2013 for OB dump expansion.',
      proposedBy: 'Rajesh Kumar', proposedByRole: 'unit_office', areaOffice: 'MCL-Angul Area',
      collieryCode: 'MCL-BHN-03', adjacentColliery: 'MCL-TLC-02', totalAreaAcres: '42.5000',
      notificationDate: new Date(Date.now() - 45 * 86400000),
      annexureA: JSON.stringify([plots[0].id, plots[1].id]),
      annexureB: JSON.stringify([plots[2].id]),
      annexureC: JSON.stringify([plots[3].id]),
      modeSpecificChecklist: JSON.stringify({ checklistCode: 'CL-1.3', items: [
        { key: 'plot_schedule', label: 'Plot schedule with boundaries', required: true, status: 'complete' },
        { key: 'title_verification', label: 'Title chain verified', required: true, status: 'complete' },
        { key: 'notification_4_1', label: '§4(1) Preliminary notification', required: true, status: 'complete' },
        { key: 'notification_4_2', label: '§4(2) SIA & public hearing', required: true, status: 'complete' },
        { key: 'public_hearing', label: 'Public hearing conducted', required: true, status: 'in_progress' },
        { key: 'award_draft', label: 'Draft award statement', required: true, status: 'pending' },
      ] }),
    },
  })
  for (const plot of plots.slice(0, 4)) {
    await db.landScheduleItem.create({ data: { scheduleId: schedule1.id, plotId: plot.id, annexureTag: plot.plotNumber === 'P-103' ? 'B' : plot.plotNumber === 'P-104' ? 'C' : 'A', isActive: true } })
  }
  const schedule2 = await db.landSchedule.create({
    data: {
      projectId: project.id, scheduleCode: 'SCH-2026-002', acquisitionMode: 'direct_purchase', state: 'Drafting',
      proposalTitle: 'Talcher Extension — Direct Purchase',
      description: 'Direct purchase of 27.1 acres from willing landowners under §46 of RFCTLARR.',
      proposedBy: 'Rajesh Kumar', proposedByRole: 'unit_office', areaOffice: 'MCL-Angul Area',
      collieryCode: 'MCL-BHN-03', adjacentColliery: 'MCL-TLC-02', totalAreaAcres: '27.1000',
      notificationDate: new Date(Date.now() - 10 * 86400000),
      modeSpecificChecklist: JSON.stringify({ checklistCode: 'CL-1.2', items: [
        { key: 'plot_schedule', label: 'Plot schedule with boundaries', required: true, status: 'complete' },
        { key: 'title_verification', label: 'Title chain verified', required: true, status: 'pending' },
        { key: 'consent_letter', label: 'Written consent from landowner', required: true, status: 'complete' },
        { key: 'valuation_sheet', label: 'Valuation per PWD rate chart', required: true, status: 'in_progress' },
        { key: 'mutation_status', label: 'Mutation status verified', required: true, status: 'pending' },
      ] }),
    },
  })
  for (const plot of plots.slice(4)) {
    await db.landScheduleItem.create({ data: { scheduleId: schedule2.id, plotId: plot.id, annexureTag: 'A', isActive: true } })
  }
  console.log(`  ✓ 2 acquisition proposals (SCH-2026-001 AreaVetting, SCH-2026-002 Drafting)`)

  // ─── HQ Parallel Vetting: spawn ReviewTasks ─────────────────
  await db.workflowReviewTask.createMany({
    data: [
      { reviewableType: 'CompensationPayroll', reviewableId: payroll.id, role: 'gm_planning', status: 'approved', decidedBy: 'GM(Planning)-MK', decidedAt: new Date(Date.now() - 86400000), comment: 'Verified plot schedules.' },
      { reviewableType: 'CompensationPayroll', reviewableId: payroll.id, role: 'gm_finance', status: 'pending' },
    ],
  })
  console.log(`  ✓ HQ parallel vetting tasks (1 approved, 1 pending)`)

  // ─── MODULE 8: Immutable Form-D Ledger ──────────────────────
  const ledgerRows = [
    { plotId: plots[0].id, amountLand: '3125000.00', amountRnr: '450000.00', payee: 'Ramesh Kumar Sahoo', utr: 'UTR8823419012', daysAgo: 5, hash: null! },
    { plotId: plots[1].id, amountLand: '2062500.00', amountRnr: '280000.00', payee: 'Sita Devi Mohanty', utr: 'UTR8823419013', daysAgo: 4, hash: null! },
  ]
  let prevHash: string | null = null
  for (const row of ledgerRows) {
    const canonical = `${row.plotId}|${row.amountLand}|${row.amountRnr}|${row.payee}|${row.utr}|${prevHash ?? 'GENESIS'}`
    const rowHash = createHash('sha256').update(canonical).digest('hex')
    await db.formDLedgerEntry.create({
      data: {
        projectId: project.id,
        plotId: row.plotId,
        amountLand: row.amountLand,
        amountRnr: row.amountRnr,
        payeeType: 'individual',
        payeeName: row.payee,
        rtgsUtrReference: row.utr,
        rowHash,
        previousHash: prevHash,
        paidAt: new Date(Date.now() - row.daysAgo * 86400000),
        state: 'approved',
      },
    })
    prevHash = rowHash
  }
  console.log(`  ✓ Form-D ledger: 2 hash-chained entries`)

  // ─── MODULE 9: Nominee Pool (cross 2.00-acre threshold demo) ─
  const pool = await db.nomineePool.create({
    data: {
      nomineeAadhaarHash: hashAadhaar('9999-8888-7777'),
      nomineeName: 'Priyanka Sahoo (Nominee)',
      pooledAcreage: '2.2500',
      applyButtonUnlocked: true,
    },
  })
  await db.nomineePoolContribution.create({
    data: { poolId: pool.id, formIClaimId: claims[0].id, shareAcres: '1.2500' },
  })
  await db.nomineePoolContribution.create({
    data: { poolId: pool.id, formIClaimId: claims[2].id, shareAcres: '1.0000' },
  })
  console.log(`  ✓ Nominee pool: 2.25 acres pooled (threshold 2.00 crossed)`)

  // ─── MODULE 6: PAF Census Records ──────────────────────────
  const pafCategories = ['homestead', 'shifting_allowance', 'cattle_shed', 'subsistence_grant'] as const
  const scCategories = ['ST', 'SC', 'OBC', 'General'] as const
  for (let i = 0; i < 6; i++) {
    await db.pafCensusRecord.create({
      data: {
        pafId: `PAF-${new Date().getFullYear()}-${String(i + 1).padStart(4, '0')}`,
        claimantName: claims[i % claims.length].claimantName,
        categoryOfEntitlement: pafCategories[i % 4],
        scStObcCategory: scCategories[i % 4],
        plotId: plots[i % plots.length].id,
        photoIdentityCardDoc: i % 3 === 0 ? `doc-paf-${i}` : null,
      },
    })
  }
  console.log(`  ✓ 6 PAF census records created`)

  // ─── MODULE 7: R&R Asset Payroll ────────────────────────────
  const rnr = await db.rnrAssetPayroll.create({
    data: {
      projectId: project.id,
      payrollCode: 'RNR-2025-0001',
      state: 'Approved',
      totalValue: '775000.00',
    },
  })
  const rnrLines = [
    { name: claims[0].claimantName, type: 'homestead', amount: '350000.00', ref: 'PWD-RR-2025-HS-001' },
    { name: claims[1].claimantName, type: 'shifting_allowance', amount: '50000.00', ref: 'PWD-RR-2025-SA-001' },
    { name: claims[2].claimantName, type: 'homestead', amount: '350000.00', ref: 'PWD-RR-2025-HS-001' },
    { name: claims[3 % claims.length].claimantName, type: 'cattle_shed', amount: '75000.00', ref: 'PWD-RR-2025-CS-001' },
  ]
  for (const l of rnrLines) {
    await db.rnrAssetPayrollLine.create({
      data: { payrollId: rnr.id, beneficiaryName: l.name, entitlementType: l.type, valuationAmount: l.amount, pwdRateReference: l.ref, formulaSnapshot: JSON.stringify({ rate: l.amount }) },
    })
  }
  console.log(`  ✓ R&R payroll RNR-2025-0001 with 4 lines`)

  // ─── MODULE 10: Employment Application ──────────────────────
  await db.employmentApplication.create({
    data: {
      applicationCode: 'EMP-2026-0117',
      projectId: project.id,
      nomineePoolId: pool.id,
      formIxBalanceAcres: '2.2500',
      formXBalanceJobs: 1,
      state: 'Cl4Checklist',
      exceptionFlags: JSON.stringify({ femaleNomineeCounselingRequired: false, landCategoryException: null }),
    },
  })
  console.log(`  ✓ Employment application EMP-2026-0117`)

  // ─── Grievance (Module 3 transparency window) ───────────────
  await db.grievance.create({
    data: {
      grievanceCode: 'GRV-2026-0034',
      relatedType: 'FormIClaim',
      relatedId: claims[1].id,
      complainantName: 'Neighbor: Durga Prasad',
      description: 'Boundary dispute on northern edge of plot P-102; claims overlap with adjoining tenancy land.',
      slaDueAt: new Date(Date.now() + 6 * 86400000),
    },
  })
  console.log(`  ✓ 1 open grievance (SLA 6 days remaining)`)

  console.log('\n✅ Seed complete. Demo data ready.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await db.$disconnect() })
