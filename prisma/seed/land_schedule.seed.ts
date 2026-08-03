// @ts-nocheck
import type { PrismaClient } from '@prisma/client'

export async function seedLandSchedule(db: PrismaClient) {
  console.log('🌱 Seeding acq_proposal...')

  const project = await db.project.findFirst()
  const plots = await db.mst_plot.findMany()

  if (!project || plots.length < 4) return
  
  const existing1 = await db.acq_proposal.findFirst({ where: { proposal_no: 'SCH-2026-001' } })
  if (!existing1) {
    const schedule1 = await db.acq_proposal.create({
      data: {
        proj_cd: project.projCd, 
        proposal_no: 'SCH-2026-001', 
        acq_mode_id: BigInt(2), 
        current_stage_cd: 'AreaVetting',
        overall_status: 'AreaVetting',
        purpose_justification: 'Bhubaneswari OCP-III — Phase A Acquisition',
        entry_by: 'Rajesh Kumar', 
        area_cd: 'MCL-Angul Area',
        mine_cd: 'MCL-TLC-02', 
        tot_acq_area: 42.5000,
        proposal_dt: new Date(Date.now() - 45 * 86400000),
        is_within_pr_limit: true,
        requires_board_approval: true
      },
    })

    for (const plot of plots.slice(0, 4)) {
      await db.plot_schedule.create({ 
        data: { 
          proposal_id: schedule1.proposal_id, 
          plot_no: plot.plot_number, 
          mouza_lgd: plot.mouza_lgd,
          acq_status: 'PROPOSED', 
          entry_by: 'system',
          to_be_acquired_area: Number(plot.area_acres),
          remarks: JSON.stringify({ annexure: plot.plot_number === 'P-103' ? 'B' : plot.plot_number === 'P-104' ? 'C' : 'A' })
        } 
      })
    }
  }

  const existing2 = await db.acq_proposal.findFirst({ where: { proposal_no: 'SCH-2026-002' } })
  if (!existing2 && plots.length > 4) {
    const schedule2 = await db.acq_proposal.create({
      data: {
        proj_cd: project.projCd, 
        proposal_no: 'SCH-2026-002', 
        acq_mode_id: BigInt(1), 
        current_stage_cd: 'Drafting',
        overall_status: 'Drafting',
        purpose_justification: 'Talcher Extension — Direct Purchase',
        entry_by: 'Rajesh Kumar', 
        area_cd: 'MCL-Angul Area',
        mine_cd: 'MCL-TLC-02', 
        tot_acq_area: 27.1000,
        proposal_dt: new Date(Date.now() - 10 * 86400000),
        is_within_pr_limit: true,
        requires_board_approval: true
      },
    })
    for (const plot of plots.slice(4)) {
      await db.plot_schedule.create({ 
        data: { 
          proposal_id: schedule2.proposal_id, 
          plot_no: plot.plot_number, 
          mouza_lgd: plot.mouza_lgd,
          acq_status: 'PROPOSED', 
          entry_by: 'system',
          to_be_acquired_area: Number(plot.area_acres),
          remarks: JSON.stringify({ annexure: 'A' })
        } 
      })
    }
  }
}
