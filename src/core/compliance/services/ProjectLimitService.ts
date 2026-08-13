import { Result, Ok, Fail } from '@/core'
import { Project } from '@/domain/entities/project/Project'
import { Proposal } from '@/domain/entities/proposal'
import { db } from '@/lib/db'
import { buildLandCategoryMap } from '@/core/compliance/utils/landCategoryMap'

export interface LimitCheckResult {
  isLimitBreached: boolean
  breachReasons: string[]
  details: {
    areaLimitAcres: number
    currentAreaAcres: number
    proposalAreaAcres: number
    budgetCeiling: number
    currentBudgetUsed: number
    proposalBudgetEst: number
    employmentQuota: number
    currentJobs: number
    proposalJobsEst: number
  }
}

export class ProjectLimitService {
  /**
   * Checks if a proposal breaches the project's approved baseline limits.
   * If it does, the proposal must be routed for Form-XXII board escalation.
   */
  async checkProposalLimits(project: Project, proposal: Proposal): Promise<Result<LimitCheckResult>> {
    try {
      const isLocked = project.isLocked()
      
      const projectAcreLimit = parseFloat(project.totalApprovedArea.toDecimal().toString())
      const projectBudgetCeiling = parseFloat(project.landBudget.add(project.rrBudget).toDecimal().toString())
      const projectEmploymentQuota = project.totalEmpSanctioned || 0

      // Query database for running totals of other proposals in this project
      // For a real implementation, we should sum up area, estimated budget, and estimated jobs
      // of all proposals in the project EXCEPT the one being checked, OR if it's new, all of them.
      
      // To get accurate area, we sum plot_schedule to_be_acquired_area for all active proposals in this project
      const plotsSum = await db.plot_schedule.aggregate({
        where: {
          acq_proposal: {
            proj_cd: project.id,
            proposal_id: { not: proposal.id },
            overall_status: { notIn: ['CANCELLED', 'REJECTED'] }
          },
          acq_status: { not: 'CANCELLED' }
        },
        _sum: {
          to_be_acquired_area: true
        }
      });

      const currentAreaAcres = Number(plotsSum._sum.to_be_acquired_area || 0);
      const proposalAreaAcres = parseFloat(proposal.totalArea.toDecimal().toString());

      // Fetch proposal record with plot schedule breakdown and rate fields
      const [propDb, landCategoryMap] = await Promise.all([
        db.acq_proposal.findUnique({
          where: { proposal_id: proposal.id },
          include: {
            plot_schedule: {
              include: {
                plot_schedule_land_type: true
              }
            }
          }
        }),
        buildLandCategoryMap()
      ]);

      const parsePositiveArea = (...vals: any[]): number => {
        for (const v of vals) {
          if (v !== null && v !== undefined) {
            const n = parseFloat(v.toString());
            if (!isNaN(n) && n > 0) return n;
          }
        }
        return 0;
      };

      let tenancyLand = 0, govtLand = 0, pattaLand = 0, forestLand = 0;
      (propDb?.plot_schedule || []).forEach(plot => {
        const pArea = parsePositiveArea(plot.to_be_acquired_area, plot.total_ror_area);
        const ltList = plot.plot_schedule_land_type || [];
        if (ltList.length > 0) {
          ltList.forEach(lt => {
            const areaToAcq = parsePositiveArea(lt.area_to_acquire, lt.area, pArea);
            // Use landt_id to look up category from the dynamic landtype map
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

      if ((tenancyLand + govtLand + pattaLand + forestLand) === 0 && proposalAreaAcres > 0) {
        tenancyLand = proposalAreaAcres;
      }

      // 1. Budget estimation based on land type rates
      const rTenancyWithEmp = Number(propDb?.rate_tenancy_land_with_emp || 0);
      const rTenancyNoEmp = Number(propDb?.rate_tenancy_land_no_emp || 0);
      const rGovt = Number(propDb?.rate_govt_land || 0);
      const rForest = Number(propDb?.rate_forest_land || 0);

      const tenancyRateToUse = rTenancyWithEmp || rTenancyNoEmp || (rGovt || rForest || 0);

      const calculatedLandCost = (tenancyLand * tenancyRateToUse) + 
                                (pattaLand * tenancyRateToUse) + 
                                (govtLand * (rGovt || tenancyRateToUse)) + 
                                (forestLand * (rForest || tenancyRateToUse));

      const storedEstBudget = Number(propDb?.total_land_cost_est || 0) + Number(propDb?.total_rehab_cost_est || 0) + Number(propDb?.total_employment_cost_est || 0);

      const currentBudgetUsed = currentAreaAcres * 1000000;
      const proposalBudgetEst = calculatedLandCost > 0 
        ? calculatedLandCost 
        : (storedEstBudget > 0 ? storedEstBudget : (tenancyRateToUse > 0 ? proposalAreaAcres * tenancyRateToUse : proposalAreaAcres * 1000000));

      // 2. Jobs estimation based on employment proposed count or tenancy acreage
      const currentJobs = Math.floor(currentAreaAcres / 2);
      const proposalJobsEst = (propDb?.employment_proposed_count && propDb.employment_proposed_count > 0)
        ? propDb.employment_proposed_count
        : Math.floor((tenancyLand + pattaLand) / 2);

      let isLimitBreached = false;
      const breachReasons: string[] = [];

      if (isLocked) {
        if (currentAreaAcres + proposalAreaAcres > projectAcreLimit) {
          isLimitBreached = true;
          breachReasons.push('Land Area Limit');
        }

        if (currentBudgetUsed + proposalBudgetEst > projectBudgetCeiling) {
          isLimitBreached = true;
          breachReasons.push('Budget Ceiling');
        }

        if (currentJobs + proposalJobsEst > projectEmploymentQuota) {
          isLimitBreached = true;
          breachReasons.push('Employment Quota');
        }
      }

      return Ok({
        isLimitBreached,
        breachReasons,
        details: {
          areaLimitAcres: projectAcreLimit,
          currentAreaAcres,
          proposalAreaAcres,
          budgetCeiling: projectBudgetCeiling,
          currentBudgetUsed,
          proposalBudgetEst,
          employmentQuota: projectEmploymentQuota,
          currentJobs,
          proposalJobsEst
        }
      });
    } catch (error: any) {
      return Fail(`Failed to check proposal limits: ${error.message}`)
    }
  }
}
