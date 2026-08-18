import { db } from '@/lib/db'
import { ok, badRequest, serverError, readJson } from '../../_lib'
import type { NextRequest } from 'next/server'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await readJson<{ pool_id?: string }>(req)
    if (!body?.pool_id) return badRequest('pool_id is required')

    const pool = await db.nominee_pool.findUnique({
      where: { id: body.pool_id },
      include: {
        nominee_pool_contribution: {
          include: {
            form_i_claim: {
              include: { form_i_claim_plot: true }
            }
          }
        }
      }
    })

    if (!pool) return badRequest('Nominee pool not found')
    
    // Find the associated project ID from the plots
    let project_id = ''
    for (const contrib of pool.nominee_pool_contribution) {
      const plot_no = contrib.form_i_claim.form_i_claim_plot[0]?.plot_no || contrib.form_i_claim.form_i_claim_plot[0]?.plot_schedule_id || ''
      const schedules = await db.plot_schedule.findMany({
        where: { plot_no: plot_no },
        include: { acq_proposal: true }
      })
      if (schedules.length > 0 && schedules[0].acq_proposal?.proj_cd) {
        project_id = schedules[0].acq_proposal.proj_cd
        break
      }
    }

    if (!project_id) {
      // Fallback: just pick any project if schedule not mapped yet for prototype
      const anyProject = await db.project.findFirst()
      if (!anyProject) return badRequest('No projects found in system')
      project_id = anyProject.projCd
    }

    const application_code = `EMP-${new Date().getFullYear()}-${String(Math.floor(1 + Math.random() * 9999)).padStart(4, '0')}`

    const application = await db.employment_application.create({
      data: {
        application_code,
        nominee_pool_id: pool.id,
        project_id,
        form_ix_balance_acres: pool.pooled_acreage as any,
        form_x_balance_jobs: Math.floor(Number(pool.pooled_acreage) / 2.0), // 1 job per 2 acres
        state: 'Drafting',
        id: randomUUID(),
        updt_ts: new Date()
      }
    })

    return ok(application, { status: 201 })
  } catch (e) {
    return serverError('Failed to create draft application', e instanceof Error ? e.message : String(e))
  }
}
