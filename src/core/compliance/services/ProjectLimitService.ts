import { Result, Ok, Fail } from '@/core'
import { Project } from '@/domain/entities/project/Project'
import { Proposal } from '@/domain/entities/proposal'
import { db } from '@/lib/db'

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

      // Budget estimation (Dummy logic: 1 Acre = 1,000,000 INR)
      const currentBudgetUsed = currentAreaAcres * 1000000;
      const proposalBudgetEst = proposalAreaAcres * 1000000;

      // Jobs estimation (Dummy logic: 1 Job per 2 Acres)
      const currentJobs = Math.floor(currentAreaAcres / 2);
      const proposalJobsEst = Math.floor(proposalAreaAcres / 2);

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
