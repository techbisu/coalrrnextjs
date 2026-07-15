import type { PrismaClient } from '@prisma/client'

export async function seedLandSchedule(db: PrismaClient) {
  console.log('🌱 Seeding land_schedule...')

  const project = await db.mst_project.findFirst()
  const plots = await db.mst_plot.findMany()

  if (!project || plots.length < 4) return
  
  const existing1 = await db.land_schedule.findFirst({ where: { schedule_code: 'SCH-2026-001' } })
  if (!existing1) {
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
  }

  const existing2 = await db.land_schedule.findFirst({ where: { schedule_code: 'SCH-2026-002' } })
  if (!existing2 && plots.length > 4) {
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
  }
}
