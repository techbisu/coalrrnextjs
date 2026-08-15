import { IFactSourceAdapter } from '../interfaces/IFactSourceAdapter'
import { CHECKABLE_ENTITY_TYPES } from '@/core/config/module-codes.config'
import { db } from '@/lib/db'

/**
 * ProjectFactAdapter
 *
 * Resolves authoritative domain data for Project Master records (project).
 * Primary key `entityId` is the `master.project.proj_cd` string.
 */
export class ProjectFactAdapter implements IFactSourceAdapter {
  readonly entityType = CHECKABLE_ENTITY_TYPES.PROJECT

  async resolveDomainFacts(entityId: string): Promise<Record<string, any>> {
    const project = await db.project.findUnique({
      where: { projCd: entityId, proj_cd: entityId } as any,
    })

    if (!project) {
      return {}
    }

    const projCd = project.projCd || (project as any).proj_cd
    const projNm = project.projNm || (project as any).proj_nm
    const approvedArea = project.totalApprovedArea ?? (project as any).target_area_acres
    const landBudget = project.landBudget ?? (project as any).budget_ceiling

    return {
      proj_cd: projCd,
      projCd: projCd,
      proj_nm: projNm,
      projNm: projNm,
      status: project.status,
      target_area_acres: approvedArea ? Number(approvedArea) : 0,
      total_approved_area: approvedArea ? Number(approvedArea) : 0,
      budget_ceiling: landBudget ? Number(landBudget) : 0,
      land_budget: landBudget ? Number(landBudget) : 0,
      is_locked: (project as any).is_locked ?? project.lockedAt != null,
    }
  }
}
