import { NextRequest } from 'next/server'
import { authorizeApi } from '@/core/authorization/middleware/authorize'
import { ok, badRequest, notFound, serverError } from '@/app/api/_lib'
import { db } from '@/lib/db'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Ctx) {
  const auth = await authorizeApi('project.view')
  if (auth.error) return auth.error

  const { id } = await params

  try {
    const project = await db.project.findUnique({
      where: { projCd: id },
      select: {
        projCd: true,
        projNm: true,
        totalApprovedArea: true,
        landBudget: true,
        rrBudget: true,
        totalEmpSanctioned: true,
        lockedAt: true,
      }
    })

    if (!project) return notFound('Project not found')

    // Sum up area from all active proposals under this project
    const areaAgg = await db.plot_schedule.aggregate({
      where: {
        acq_proposal: {
          proj_cd: id,
          overall_status: { notIn: ['CANCELLED', 'REJECTED'] }
        },
        acq_status: { not: 'CANCELLED' }
      },
      _sum: { to_be_acquired_area: true }
    })

    const currentAreaAcres = Number(areaAgg._sum.to_be_acquired_area || 0)
    const approvedAreaAcres = Number(project.totalApprovedArea || 0)
    const budgetCeiling = Number(project.landBudget || 0) + Number(project.rrBudget || 0)
    const employmentQuota = project.totalEmpSanctioned || 0

    // Budget/jobs estimates based on area (same logic as ProjectLimitService)
    const currentBudgetEst = currentAreaAcres * 1000000
    const currentJobsEst = Math.floor(currentAreaAcres / 2)

    const areaRemaining = approvedAreaAcres - currentAreaAcres
    const budgetRemaining = budgetCeiling - currentBudgetEst
    const jobsRemaining = employmentQuota - currentJobsEst

    return ok({
      project_id: id,
      project_name: project.projNm,
      is_locked: !!project.lockedAt,
      limits: {
        area: {
          approved_acres: approvedAreaAcres,
          used_acres: currentAreaAcres,
          remaining_acres: areaRemaining,
          utilization_pct: approvedAreaAcres > 0 ? ((currentAreaAcres / approvedAreaAcres) * 100).toFixed(1) : '0.0',
          is_breached: currentAreaAcres > approvedAreaAcres
        },
        budget: {
          ceiling_inr: budgetCeiling,
          used_est_inr: currentBudgetEst,
          remaining_est_inr: budgetRemaining,
          utilization_pct: budgetCeiling > 0 ? ((currentBudgetEst / budgetCeiling) * 100).toFixed(1) : '0.0',
          is_breached: currentBudgetEst > budgetCeiling
        },
        employment: {
          quota: employmentQuota,
          used_est: currentJobsEst,
          remaining_est: jobsRemaining,
          utilization_pct: employmentQuota > 0 ? ((currentJobsEst / employmentQuota) * 100).toFixed(1) : '0.0',
          is_breached: currentJobsEst > employmentQuota
        }
      }
    })
  } catch (e: any) {
    console.error('GET /api/projects/[id]/limits error:', e)
    return serverError('Failed to fetch project limits', e.message)
  }
}
