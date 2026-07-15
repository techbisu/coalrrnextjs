import { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'
import { seedCommonTranslations } from '../seed-common'
import { seedRbac } from '../seed-rbac'

const db = new PrismaClient()

async function main() {
  console.log('🌱 Seeding COALRR demo data...')

  // Idempotent: wipe existing data first (order matters for FK constraints)
  await db.auth_session.deleteMany()
  await db.user.deleteMany()
  await db.workflow_review_task.deleteMany()
  await db.grievance.deleteMany()
  await db.employment_application.deleteMany()
  await db.nominee_pool_contribution.deleteMany()
  await db.nominee_pool.deleteMany()
  await db.form_d_ledger_entry.deleteMany()
  await db.compensation_payroll_line.deleteMany()
  await db.compensation_payroll.deleteMany()
  await db.form_i_claim.deleteMany()
  await db.land_schedule_item.deleteMany()
  await db.land_schedule.deleteMany()
  await db.paf_census_record.deleteMany()
  await db.rnr_asset_payroll_line.deleteMany()
  await db.rnr_asset_payroll.deleteMany()
  await db.document.deleteMany()
  await db.mst_plot.deleteMany()
  await db.mouza_master.deleteMany()
  await db.mst_project.deleteMany()
  await db.language.deleteMany()
  await db.translation_value.deleteMany()
  await db.translation_key.deleteMany()
  await db.translation_module.deleteMany()
  
  // ─── LOCALIZATION: Languages ──────────────────────────────
  const languages = await Promise.all([
    db.language.create({ data: { code: 'en', name: 'English', native_name: 'English', is_default: true, sort_order: 1 } }),
    db.language.create({ data: { code: 'hi', name: 'Hindi', native_name: 'हिन्दी', is_default: false, sort_order: 2 } }),
    db.language.create({ data: { code: 'or', name: 'Odia', native_name: 'ଓଡ଼ିଆ', is_default: false, sort_order: 3 } })
  ])
  console.log(`  ✓ 3 Languages seeded: English, Hindi, Odia`)

  const commonModule = await db.translation_module.create({
    data: { name: 'common', description: 'Common shared translations' }
  })

  const commonKeys = [
    { key: 'shell.loading', en: 'Loading...', hi: 'लोड हो रहा है...', or: 'ଲୋଡ୍ ହେଉଛି...' },
    { key: 'actions.save', en: 'Save', hi: 'सहेजें', or: 'ସେଭ୍ କରନ୍ତୁ' },
    { key: 'actions.cancel', en: 'Cancel', hi: 'रद्द करें', or: 'ବାତିଲ୍ କରନ୍ତୁ' },
  ]

  for (const k of commonKeys) {
    const tKey = await db.translation_key.create({
      data: { module_id: commonModule.id, key: k.key }
    })
    
    await db.translation_value.createMany({
      data: [
        { translation_key_id: tKey.id, language_id: languages[0].id, value: k.en, status: 'approved' },
        { translation_key_id: tKey.id, language_id: languages[1].id, value: k.hi, status: 'approved' },
        { translation_key_id: tKey.id, language_id: languages[2].id, value: k.or, status: 'approved' },
      ]
    })
  }
  console.log(`  ✓ Common translations seeded`)

  // ─── AUTH: ECL officers + sample citizen ─────────────────────
  const hashPassword = (p: string) => createHash('sha256').update(p).digest('hex')
  const eclUsers = [
    { email: 'unit@coalrr.gov.in', name: 'Rajesh Kumar', role: 'unit_office', designation: 'Unit Surveyor', colliery_code: 'MCL-BHN-03' },
    { email: 'area@coalrr.gov.in', name: 'Sneha Mohanty', role: 'area_office', designation: 'Area Land Dealing Officer', colliery_code: 'MCL-ANG-01' },
    { email: 'gm.planning@coalrr.gov.in', name: 'Manoj Kumar', role: 'gm_planning', designation: 'GM (Planning)', colliery_code: 'MCL-HQ' },
    { email: 'gm.finance@coalrr.gov.in', name: 'Anita Das', role: 'gm_finance', designation: 'GM (Finance)', colliery_code: 'MCL-HQ' },
    { email: 'director@coalrr.gov.in', name: 'Prakash Rao', role: 'director', designation: 'Director (P&R)', colliery_code: 'MCL-HQ' },
    { email: 'cmd@coalrr.gov.in', name: 'Vikram Singh', role: 'cmd', designation: 'CMD', colliery_code: 'MCL-HQ' },
  ]
  for (const u of eclUsers) {
    await db.user.create({ data: { ...u, portal: 'ecl', password_hash: hashPassword('demo1234') } })
  }
  console.log(`  ✓ ${eclUsers.length} ECL officer accounts (password: demo1234)`)

  // ─── MODULE 1: Project Master & GIS ─────────────────────────
  const project = await db.mst_project.create({
    data: {
      name: 'Bhubaneswari OCP Phase-III Expansion',
      colliery_code: 'MCL-BHN-03',
      total_land_limit_acres: '450.0000',
      total_budget_ceiling: '1875000000.00', // ₹187.5 Cr
      total_employment_quota: 90,
      boundary: JSON.stringify({
        type: 'MultiPolygon',
        coordinates: [[[[84.05, 21.45], [84.15, 21.45], [84.15, 21.55], [84.05, 21.55], [84.05, 21.45]]]],
        color: '#16a34a',
      }),
      statutory_clearances: JSON.stringify([
        { authority: 'DGMS', referenceNo: 'DGMS/2025/4471', issuedOn: '2025-03-11' },
        { authority: 'State Environment', referenceNo: 'SEIAA-OD-2025-228', issuedOn: '2025-04-02' },
        { authority: 'Forest Dept', referenceNo: 'FD-DKL-2025-1190', issuedOn: '2025-05-18' },
      ]),
      locked_at: new Date('2025-06-01T10:00:00Z'),
    },
  })
  console.log(`  ✓ Project: ${project.name}`)

  // ─── Master Mouza & Plots ────────────────────────────────────
  const mouza = await db.mouza_master.create({
    data: { mouza_lgd: 111n, mouza_en: 'Hingula', state_lgd: 21n, district_lgd: 367n, block_lgd: 1n, is_active: true },
  })
  const mouza2 = await db.mouza_master.create({
    data: { mouza_lgd: 222n, mouza_en: 'Talcher', state_lgd: 21n, district_lgd: 367n, block_lgd: 1n, is_active: true },
  })

  const plotData = [
    { mouza_id: mouza.id, plot_number: 'P-101', khata_number: 'K-44/1', land_type: 'tenancy', area_acres: '12.5000', remaining_job_quota: 3 },
    { mouza_id: mouza.id, plot_number: 'P-102', khata_number: 'K-44/2', land_type: 'got_patta', area_acres: '8.2500', remaining_job_quota: 2 },
    { mouza_id: mouza.id, plot_number: 'P-103', khata_number: 'K-45/1', land_type: 'forest', area_acres: '15.7500', remaining_job_quota: 4 },
    { mouza_id: mouza.id, plot_number: 'P-104', khata_number: 'K-45/2', land_type: 'tenancy', area_acres: '6.0000', remaining_job_quota: 1 },
    { mouza_id: mouza2.id, plot_number: 'T-201', khata_number: 'K-50/1', land_type: 'tenancy', area_acres: '22.3000', remaining_job_quota: 5 },
    { mouza_id: mouza2.id, plot_number: 'T-202', khata_number: 'K-50/2', land_type: 'debottar', area_acres: '4.8000', remaining_job_quota: 1 },
  ]
  const plots = await Promise.all(plotData.map(p => db.mst_plot.create({ data: p })))
  console.log(`  ✓ ${plots.length} plots across 2 mouzas`)

  // ─── MODULE 3: Form-I Claims (landowner registry) ───────────
  const hashAadhaar = (n: string) => createHash('sha256').update(n).digest('hex').slice(0, 16)
  const claimsData = [
    { plot_id: plots[0].id, aadhaar: '1234-5678-9012', name: 'Ramesh Kumar Sahoo', share: '12.5000', optEmp: true, bank: 'SBIN0001234', ifsc: 'SBIN0001234', state: 'Published', submittedDaysAgo: 25 },
    { plot_id: plots[1].id, aadhaar: '2345-6789-0123', name: 'Sita Devi Mohanty', share: '8.2500', optEmp: false, bank: 'ICIC0005678', ifsc: 'ICIC0005678', state: 'TransparencyWindow', submittedDaysAgo: 8 },
    { plot_id: plots[2].id, aadhaar: '3456-7890-1234', name: 'Bhagirathi Behera', share: '15.7500', optEmp: true, bank: 'PUNB0009012', ifsc: 'PUNB0009012', state: 'TitleScrutiny', submittedDaysAgo: 3 },
    { plot_id: plots[3].id, aadhaar: '4567-8901-2345', name: 'Anjali Pradhan', share: '6.0000', optEmp: true, bank: 'UBIN0003456', ifsc: 'UBIN0003456', state: 'Drafting', submittedDaysAgo: 0 },
  ]
  const claims: Awaited<ReturnType<typeof db.form_i_claim.create>>[] = []
  for (const c of claimsData) {
    const submitted_at = c.submittedDaysAgo > 0 ? new Date(Date.now() - c.submittedDaysAgo * 86400000) : null
    const twEnds = submitted_at ? new Date(submitted_at.getTime() + 21 * 86400000) : null
    const claim = await db.form_i_claim.create({
      data: {
        claim_code: `FORM1-2026-${String(claims.length + 1).padStart(4, '0')}`,
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
    claims.push(claim)
  }
  console.log(`  ✓ ${claims.length} Form-I claims`)

  // ─── MODULE 4: Compensation Payroll (with calculated lines) ──
  // Per spec §2.1: Solatium = 100% of (Land + Asset); Escalation = 12% × Land × years
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
    // Use string math (mirrors BCMath) — kept consistent with Math Engine
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
  console.log(`  ✓ Payroll PR-2026-0412 with ${payrollLines.length} lines, total ₹${batchTotal.toFixed(2)}`)

  // ─── MODULE 2: Land Acquisition Proposals ───────────────────
  const schedule1 = await db.land_schedule.create({
    data: {
      project_id: project.id, schedule_code: 'SCH-2026-001', acquisition_mode: 'rfctlarr', state: 'AreaVetting',
      proposal_title: 'Bhubaneswari OCP-III — Phase A Acquisition',
      description: 'Acquisition of 42.5 acres under RFCTLARR Act, 2013 for OB dump expansion.',
      proposed_by: 'Rajesh Kumar', proposed_by_role: 'unit_office', area_office: 'MCL-Angul Area',
      colliery_code: 'MCL-BHN-03', adjacent_colliery: 'MCL-TLC-02', total_area_acres: '42.5000',
      notification_date: new Date(Date.now() - 45 * 86400000),
      annexure_a: JSON.stringify([plots[0].id, plots[1].id]),
      annexure_b: JSON.stringify([plots[2].id]),
      annexure_c: JSON.stringify([plots[3].id]),
      mode_specific_checklist: JSON.stringify({ checklistCode: 'CL-1.3', items: [
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
    await db.land_schedule_item.create({ data: { schedule_id: schedule1.id, plot_id: plot.id, annexure_tag: plot.plot_number === 'P-103' ? 'B' : plot.plot_number === 'P-104' ? 'C' : 'A', is_active: true } })
  }
  const schedule2 = await db.land_schedule.create({
    data: {
      project_id: project.id, schedule_code: 'SCH-2026-002', acquisition_mode: 'direct_purchase', state: 'Drafting',
      proposal_title: 'Talcher Extension — Direct Purchase',
      description: 'Direct purchase of 27.1 acres from willing landowners under §46 of RFCTLARR.',
      proposed_by: 'Rajesh Kumar', proposed_by_role: 'unit_office', area_office: 'MCL-Angul Area',
      colliery_code: 'MCL-BHN-03', adjacent_colliery: 'MCL-TLC-02', total_area_acres: '27.1000',
      notification_date: new Date(Date.now() - 10 * 86400000),
      mode_specific_checklist: JSON.stringify({ checklistCode: 'CL-1.2', items: [
        { key: 'plot_schedule', label: 'Plot schedule with boundaries', required: true, status: 'complete' },
        { key: 'title_verification', label: 'Title chain verified', required: true, status: 'pending' },
        { key: 'consent_letter', label: 'Written consent from landowner', required: true, status: 'complete' },
        { key: 'valuation_sheet', label: 'Valuation per PWD rate chart', required: true, status: 'in_progress' },
        { key: 'mutation_status', label: 'Mutation status verified', required: true, status: 'pending' },
      ] }),
    },
  })
  for (const plot of plots.slice(4)) {
    await db.land_schedule_item.create({ data: { schedule_id: schedule2.id, plot_id: plot.id, annexure_tag: 'A', is_active: true } })
  }
  console.log(`  ✓ 2 acquisition proposals (SCH-2026-001 AreaVetting, SCH-2026-002 Drafting)`)

  // ─── HQ Parallel Vetting: spawn ReviewTasks ─────────────────
  await db.workflow_review_task.createMany({
    data: [
      { reviewable_type: 'compensation_payroll', reviewable_id: payroll.id, role: 'gm_planning', status: 'approved', decided_by: 'GM(Planning)-MK', decided_at: new Date(Date.now() - 86400000), comment: 'Verified plot schedules.' },
      { reviewable_type: 'compensation_payroll', reviewable_id: payroll.id, role: 'gm_finance', status: 'pending' },
    ],
  })
  console.log(`  ✓ HQ parallel vetting tasks (1 approved, 1 pending)`)

  // ─── MODULE 8: Immutable Form-D Ledger ──────────────────────
  const ledgerRows = [
    { plot_id: plots[0].id, amount_land: '3125000.00', amount_rnr: '450000.00', payee: 'Ramesh Kumar Sahoo', utr: 'UTR8823419012', daysAgo: 5, hash: null! },
    { plot_id: plots[1].id, amount_land: '2062500.00', amount_rnr: '280000.00', payee: 'Sita Devi Mohanty', utr: 'UTR8823419013', daysAgo: 4, hash: null! },
  ]
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
  console.log(`  ✓ Form-D ledger: 2 hash-chained entries`)

  // ─── MODULE 9: Nominee Pool (cross 2.00-acre threshold demo) ─
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
  console.log(`  ✓ Nominee pool: 2.25 acres pooled (threshold 2.00 crossed)`)

  // ─── MODULE 6: PAF Census Records ──────────────────────────
  const pafCategories = ['homestead', 'shifting_allowance', 'cattle_shed', 'subsistence_grant'] as const
  const scCategories = ['ST', 'SC', 'OBC', 'General'] as const
  for (let i = 0; i < 6; i++) {
    await db.paf_census_record.create({
      data: {
        paf_id: `PAF-${new Date().getFullYear()}-${String(i + 1).padStart(4, '0')}`,
        claimant_name: claims[i % claims.length].claimant_name,
        category_of_entitlement: pafCategories[i % 4],
        sc_st_obc_category: scCategories[i % 4],
        plot_id: plots[i % plots.length].id,
        photo_identity_card_doc: i % 3 === 0 ? `doc-paf-${i}` : null,
      },
    })
  }
  console.log(`  ✓ 6 PAF census records created`)

  // ─── MODULE 7: R&R Asset Payroll ────────────────────────────
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
    { name: claims[3 % claims.length].claimant_name, type: 'cattle_shed', amount: '75000.00', ref: 'PWD-RR-2025-CS-001' },
  ]
  for (const l of rnrLines) {
    await db.rnr_asset_payroll_line.create({
      data: { payroll_id: rnr.id, beneficiary_name: l.name, entitlement_type: l.type, valuation_amount: l.amount, pwd_rate_reference: l.ref, formula_snapshot: JSON.stringify({ rate: l.amount }) },
    })
  }
  console.log(`  ✓ R&R payroll RNR-2025-0001 with 4 lines`)

  // ─── MODULE 10: Employment Application ──────────────────────
  await db.employment_application.create({
    data: {
      application_code: 'EMP-2026-0117',
      project_id: project.id,
      nominee_pool_id: pool.id,
      form_ix_balance_acres: '2.2500',
      form_x_balance_jobs: 1,
      state: 'Cl4Checklist',
      exception_flags: JSON.stringify({ femaleNomineeCounselingRequired: false, landCategoryException: null }),
    },
  })
  console.log(`  ✓ Employment application EMP-2026-0117`)

  // ─── grievance (Module 3 transparency window) ───────────────
  await db.grievance.create({
    data: {
      grievance_code: 'GRV-2026-0034',
      related_type: 'form_i_claim',
      related_id: claims[1].id,
      complainant_name: 'Neighbor: Durga Prasad',
      description: 'Boundary dispute on northern edge of plot P-102; claims overlap with adjoining tenancy land.',
      sla_due_at: new Date(Date.now() + 6 * 86400000),
    },
  })
  console.log(`  ✓ 1 open grievance (SLA 6 days remaining)`)

  // ─── LOCALIZATION: Common Translations ──────────────────────
  await seedCommonTranslations()

  // ─── RBAC: Enterprise Permissions ─────────────────────────────
  await seedRbac()

  console.log('\n✅ Seed complete. Demo data ready.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await db.$disconnect() })
