import { NextRequest } from 'next/server'
import { authorizeApi } from '@/core/authorization/middleware/authorize'
import { ok, badRequest, notFound, serverError } from '@/app/api/_lib'
import { getProposalDetailsUseCase } from '@/infrastructure/di/Container'
import { db } from '@/lib/db'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const auth = await authorizeApi('proposal.view')
  if (auth.error) return auth.error

  try {
    // Get proposal to find project_id
    const proposalResult = await getProposalDetailsUseCase.execute({ proposalId: id })
    if (proposalResult.isFailure) return notFound('Proposal not found')

    const projectId = proposalResult.value!.project_id

    // Get project limits
    const project = await db.project.findUnique({
      where: { projCd: projectId },
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

    // Sum area of all active proposals in this project EXCEPT the current one
    const otherProposalsArea = await db.plot_schedule.aggregate({
      where: {
        acq_proposal: {
          proj_cd: projectId,
          proposal_id: { not: id },
          overall_status: { notIn: ['CANCELLED', 'REJECTED'] }
        },
        acq_status: { not: 'CANCELLED' }
      },
      _sum: { to_be_acquired_area: true }
    })

    // Area of this proposal's own plots
    const thisProposalArea = await db.plot_schedule.aggregate({
      where: {
        proposal_id: id,
        acq_status: { not: 'CANCELLED' }
      },
      _sum: { to_be_acquired_area: true }
    })

    const projectAreaLimit = Number(project.totalApprovedArea || 0)
    const projectBudget = Number(project.landBudget || 0) + Number(project.rrBudget || 0)
    const projectJobQuota = project.totalEmpSanctioned || 0

    const otherAcres = Number(otherProposalsArea._sum.to_be_acquired_area || 0)
    const thisAcres = Number(thisProposalArea._sum.to_be_acquired_area || 0)
    const totalAcres = otherAcres + thisAcres

    // Budget & job estimates (same logic as ProjectLimitService)
    const totalBudgetEst = totalAcres * 1000000
    const totalJobsEst = Math.floor(totalAcres / 2)
    const thisBudgetEst = thisAcres * 1000000
    const thisJobsEst = Math.floor(thisAcres / 2)

    const breaches: string[] = []
    if (totalAcres > projectAreaLimit) breaches.push('Land Area')
    if (totalBudgetEst > projectBudget) breaches.push('Budget Ceiling')
    if (totalJobsEst > projectJobQuota) breaches.push('Employment Quota')

    return ok({
      proposal_id: id,
      project_id: projectId,
      project_name: project.projNm,
      is_limit_breached: breaches.length > 0,
      breach_reasons: breaches,
      details: {
        area: {
          project_limit_acres: projectAreaLimit,
          other_proposals_acres: otherAcres,
          this_proposal_acres: thisAcres,
          total_acres: totalAcres,
          is_breached: totalAcres > projectAreaLimit,
        },
        budget: {
          project_ceiling_inr: projectBudget,
          estimated_total_inr: totalBudgetEst,
          this_proposal_est_inr: thisBudgetEst,
          is_breached: totalBudgetEst > projectBudget,
        },
        employment: {
          project_quota: projectJobQuota,
          estimated_total_jobs: totalJobsEst,
          this_proposal_est_jobs: thisJobsEst,
          is_breached: totalJobsEst > projectJobQuota,
        }
      }
    })
  } catch (e: any) {
    console.error('GET /api/proposals/[id]/limits error:', e)
    return serverError('Failed to check proposal limits', e.message)
  }
}
