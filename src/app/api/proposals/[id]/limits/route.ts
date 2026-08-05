import { NextRequest, NextResponse } from 'next/server'
import { authorizeApi } from '@/core/authorization/middleware/authorize'
import { ok, notFound } from '@/app/api/_lib'
import { getProposalDetailsUseCase } from '@/infrastructure/di/Container'
import { db } from '@/lib/db'
import { buildLandCategoryMap } from '@/core/compliance/utils/landCategoryMap'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const auth = await authorizeApi('proposal.view')
  if (auth.error) return auth.error

  try {
    // Get proposal to find project_id
    const proposalResult = await getProposalDetailsUseCase.execute({ proposalId: id })
    if (proposalResult.isFailure) return notFound('Proposal not found')

    const realProposalId = (proposalResult.value as any)?.id || (proposalResult.value as any)?.proposal_id || id;
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

    const isIdUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const isRealIdUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(realProposalId);

    const orConditions: any[] = [
      { proposal_no: id },
      { proposal_no: realProposalId },
    ];
    if (isRealIdUuid) orConditions.push({ proposal_id: realProposalId });
    if (isIdUuid) orConditions.push({ proposal_id: id });

    // Fetch current proposal with plot schedule land type breakdown
    const [prop, landCategoryMap] = await Promise.all([
      db.acq_proposal.findFirst({
        where: { OR: orConditions },
        include: {
          plot_schedule: {
            include: {
              plot_schedule_land_type: true
            }
          }
        }
      }),
      buildLandCategoryMap()
    ])

    const actualUuid = prop?.proposal_id || realProposalId;

    // Sum area of all active proposals in this project EXCEPT the current one
    const otherProposalsArea = await db.plot_schedule.aggregate({
      where: {
        acq_proposal: {
          proj_cd: projectId,
          proposal_id: { not: actualUuid },
          overall_status: { notIn: ['CANCELLED', 'REJECTED'] }
        },
        acq_status: { not: 'CANCELLED' }
      },
      _sum: { to_be_acquired_area: true }
    })

    const parsePositiveArea = (...vals: any[]): number => {
      for (const v of vals) {
        if (v !== null && v !== undefined) {
          const n = parseFloat(v.toString());
          if (!isNaN(n) && n > 0) return n;
        }
      }
      return 0;
    };

    // Area of this proposal's own plots & land type breakup — driven by landtype_master
    let tenancyLand = 0, govtLand = 0, pattaLand = 0, forestLand = 0;
    let thisAcres = 0;

    (prop?.plot_schedule || []).forEach(plot => {
      const pArea = parsePositiveArea(plot.to_be_acquired_area, plot.total_ror_area);
      thisAcres += pArea;

      const ltList = plot.plot_schedule_land_type || [];
      if (ltList.length > 0) {
        ltList.forEach(lt => {
          const areaToAcq = parsePositiveArea(lt.area_to_acquire, lt.area, pArea);
          // Use landt_id to look up category from the dynamic landtype_master map
          const category = landCategoryMap.get(Number(lt.landt_id)) || 'TENANCY';

          if (category === 'GOVT') govtLand += areaToAcq;
          else if (category === 'FOREST') forestLand += areaToAcq;
          else if (category === 'PATTA') pattaLand += areaToAcq;
          else tenancyLand += areaToAcq;
        });
      } else {
        tenancyLand += pArea;
      }
    });

    if (thisAcres === 0 && prop?.tot_acq_area) {
      thisAcres = parseFloat(prop.tot_acq_area.toString());
    }

    if ((tenancyLand + govtLand + pattaLand + forestLand) === 0 && thisAcres > 0) {
      tenancyLand = thisAcres;
    }

    const projectAreaLimit = Number(project.totalApprovedArea || 0)
    const projectBudget = Number(project.landBudget || 0) + Number(project.rrBudget || 0)
    const projectJobQuota = project.totalEmpSanctioned || 0

    const otherAcres = Number(otherProposalsArea._sum.to_be_acquired_area || 0)
    const totalAcres = otherAcres + thisAcres

    // 1. Land type-wise rate per acre parameters from proposal
    const rTenancyWithEmp = Number(prop?.rate_tenancy_land_with_emp || 0);
    const rTenancyNoEmp = Number(prop?.rate_tenancy_land_no_emp || 0);
    const rGovt = Number(prop?.rate_govt_land || 0);
    const rForest = Number(prop?.rate_forest_land || 0);

    const tenancyRateToUse = rTenancyWithEmp || rTenancyNoEmp || (rGovt || rForest || 0);

    const calculatedLandCost = (tenancyLand * tenancyRateToUse) + 
                              (pattaLand * tenancyRateToUse) + 
                              (govtLand * (rGovt || tenancyRateToUse)) + 
                              (forestLand * (rForest || tenancyRateToUse));

    const storedEstBudget = Number(prop?.total_land_cost_est || 0) + Number(prop?.total_rehab_cost_est || 0) + Number(prop?.total_employment_cost_est || 0);

    const thisBudgetEst = calculatedLandCost > 0 
      ? calculatedLandCost 
      : (storedEstBudget > 0 ? storedEstBudget : (tenancyRateToUse > 0 ? thisAcres * tenancyRateToUse : thisAcres * 1000000));

    const otherBudgetEst = otherAcres * 1000000;
    const totalBudgetEst = otherBudgetEst + thisBudgetEst;

    // 2. Employment jobs calculation
    const propEmpCount = prop?.employment_proposed_count || 0;
    const thisJobsEst = propEmpCount > 0 
      ? propEmpCount 
      : Math.floor((tenancyLand + pattaLand) / 2);

    const otherJobsEst = Math.floor(otherAcres / 2);
    const totalJobsEst = otherJobsEst + thisJobsEst;

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
      debug_info: {
        prop_found: !!prop,
        prop_id: prop?.proposal_id,
        prop_no: prop?.proposal_no,
        plot_count: prop?.plot_schedule?.length || 0,
        thisAcres,
        tenancyLand,
        pattaLand,
        govtLand,
        forestLand,
        thisJobsEst,
        propEmpCount
      },
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
    return NextResponse.json({ error: 'Failed to check proposal limits', details: e.message }, { status: 500 })
  }
}
