// GET /api/dashboard — aggregate KPI data for the main dashboard
import { db } from '@/lib/db'
import { ok, dec, iso, serverError } from '../_lib'
import type { NextRequest } from 'next/server'

export async function GET(_req: NextRequest) {
  try {
    const [
      projects, plots, claims, payrolls, ledgerEntries,
      nomineePools, employmentApps, grievances, reviewTasks,
    ] = await Promise.all([
      db.mstProject.findMany({ include: { _count: { select: { landSchedules: true, payrolls: true } } } }),
      db.mstPlot.findMany({ include: { mouza: true } }),
      db.formIClaim.findMany({ include: { plot: true } }),
      db.compensationPayroll.findMany({ include: { lines: true, project: true } }),
      db.formDLedgerEntry.findMany({ orderBy: { paidAt: 'desc' } }),
      db.nomineePool.findMany({ include: { contributions: { include: { formIClaim: true } } } }),
      db.employmentApplication.findMany(),
      db.grievance.findMany({ orderBy: { slaDueAt: 'asc' } }),
      db.workflowReviewTask.findMany({ orderBy: { createdAt: 'desc' } }),
    ])

    const totalBudget = projects.reduce((s, p) => s + Number(p.totalBudgetCeiling), 0)
    const totalSpent = ledgerEntries.reduce((s, e) => s + Number(e.amountLand) + Number(e.amountRnr), 0)
    const totalAcreage = plots.reduce((s, p) => s + Number(p.areaAcres), 0)
    const totalAwardPending = payrolls
      .filter((p) => p.state !== 'Published')
      .reduce((s, p) => s + Number(p.totalAward), 0)

    const openGrievances = grievances.filter((g) => !g.resolution)
    const pendingReviews = reviewTasks.filter((r) => r.status === 'pending')

    const now = Date.now()
    const notifications = [
      ...openGrievances.map((g) => ({
        id: g.id,
        type: 'grievance' as const,
        title: `Grievance ${g.grievanceCode}`,
        message: g.description.slice(0, 120),
        timestamp: g.createdAt.toISOString(),
        read: false,
      })),
      ...claims
        .filter((c) => c.transparencyWindowEndsAt && new Date(c.transparencyWindowEndsAt).getTime() > now)
        .map((c) => ({
          id: `sla-${c.id}`,
          type: 'sla' as const,
          title: `Transparency window: ${c.claimCode}`,
          message: `Ends ${new Date(c.transparencyWindowEndsAt!).toLocaleDateString('en-IN')}`,
          timestamp: c.submittedAt?.toISOString() ?? c.createdAt.toISOString(),
          read: false,
        })),
      ...pendingReviews.slice(0, 5).map((r) => ({
        id: `rev-${r.id}`,
        type: 'approval' as const,
        title: `Pending review: ${r.role}`,
        message: `${r.reviewableType} awaiting ${r.role} decision`,
        timestamp: r.createdAt.toISOString(),
        read: false,
      })),
    ]

    const stateDistribution: Record<string, number> = {}
    for (const p of payrolls) stateDistribution[p.state] = (stateDistribution[p.state] ?? 0) + 1
    for (const c of claims) stateDistribution[c.state] = (stateDistribution[c.state] ?? 0) + 1
    for (const a of employmentApps) stateDistribution[a.state] = (stateDistribution[a.state] ?? 0) + 1

    const landTypeDistribution: Record<string, number> = {}
    for (const p of plots) landTypeDistribution[p.landType] = (landTypeDistribution[p.landType] ?? 0) + 1

    return ok({
      stats: {
        projectCount: projects.length,
        plotCount: plots.length,
        claimCount: claims.length,
        payrollCount: payrolls.length,
        ledgerEntryCount: ledgerEntries.length,
        nomineePoolCount: nomineePools.length,
        employmentAppCount: employmentApps.length,
        openGrievanceCount: openGrievances.length,
        pendingReviewCount: pendingReviews.length,
        totalBudget: totalBudget.toFixed(2),
        totalSpent: totalSpent.toFixed(2),
        budgetUtilization: totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : '0',
        totalAcreage: totalAcreage.toFixed(4),
        totalAwardPending: totalAwardPending.toFixed(2),
      },
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        collieryCode: p.collieryCode,
        totalLandLimitAcres: dec(p.totalLandLimitAcres),
        totalBudgetCeiling: dec(p.totalBudgetCeiling),
        totalEmploymentQuota: p.totalEmploymentQuota,
        lockedAt: iso(p.lockedAt),
        scheduleCount: p._count.landSchedules,
        payrollCount: p._count.payrolls,
      })),
      plots: plots.map((p) => ({
        id: p.id,
        plotNumber: p.plotNumber,
        mouza: p.mouza.name,
        landType: p.landType,
        areaAcres: dec(p.areaAcres),
        exhaustedAreaForJobs: dec(p.exhaustedAreaForJobs),
        remainingJobQuota: p.remainingJobQuota,
      })),
      payrolls: payrolls.map((p) => ({
        id: p.id,
        payrollCode: p.payrollCode,
        projectName: p.project.name,
        state: p.state,
        landownerCount: p.landownerCount,
        totalAward: dec(p.totalAward),
        multiplicationFactor: dec(p.multiplicationFactor),
        lineCount: p.lines.length,
        createdAt: p.createdAt.toISOString(),
      })),
      ledgerEntries: ledgerEntries.map((e) => ({
        id: e.id,
        plotId: e.plotId,
        payeeName: e.payeeName,
        amountLand: dec(e.amountLand),
        amountRnr: dec(e.amountRnr),
        rtgsUtrReference: e.rtgsUtrReference,
        rowHash: e.rowHash,
        previousHash: e.previousHash,
        state: e.state,
        paidAt: e.paidAt.toISOString(),
      })),
      nomineePools: nomineePools.map((np) => ({
        id: np.id,
        nomineeName: np.nomineeName,
        pooledAcreage: dec(np.pooledAcreage),
        applyButtonUnlocked: np.applyButtonUnlocked,
        contributionCount: np.contributions.length,
      })),
      employmentApps: employmentApps.map((a) => ({
        id: a.id,
        applicationCode: a.applicationCode,
        formIxBalanceAcres: dec(a.formIxBalanceAcres),
        formXBalanceJobs: a.formXBalanceJobs,
        state: a.state,
      })),
      grievances: grievances.map((g) => ({
        id: g.id,
        grievanceCode: g.grievanceCode,
        complainantName: g.complainantName,
        description: g.description,
        slaDueAt: g.slaDueAt.toISOString(),
        resolution: g.resolution,
        daysRemaining: Math.ceil((g.slaDueAt.getTime() - now) / 86400000),
      })),
      reviewTasks: reviewTasks.map((r) => ({
        id: r.id,
        reviewableType: r.reviewableType,
        reviewableId: r.reviewableId,
        role: r.role,
        status: r.status,
        decidedBy: r.decidedBy,
        decidedAt: iso(r.decidedAt),
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
      })),
      notifications,
      stateDistribution,
      landTypeDistribution,
    })
  } catch (e) {
    return serverError('Failed to load dashboard', e instanceof Error ? e.message : String(e))
  }
}
