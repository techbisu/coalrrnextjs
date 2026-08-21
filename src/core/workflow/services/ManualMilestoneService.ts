/**
 * ManualMilestoneService — DB-driven milestone dependency enforcement.
 *
 * CHANGED: milestone sequence rules are now read from `milestone_definition`
 * and `milestone_dependency` tables, NOT from the hardcoded milestoneConfig.
 * Adding a new module's milestones now only requires DB inserts — zero code changes.
 */
import { Result, Ok, Fail } from '@/core'
import { db } from '@/lib/db'
import { Audit } from '@/core/audit/services/AuditService'

export interface RecordMilestoneDTO {
  entity_type: string;
  entity_id: string;
  milestone_type: string;
  authority?: string;
  reference_no?: string;
  milestone_date: Date;
  outcome: string;
  remarks?: string;
  proof_document_id?: string;
  user_id: string;
}

export class ManualMilestoneService {
  /**
   * Record a milestone. Enforces prerequisite dependencies from `milestone_dependency` table.
   */
  async recordMilestone(data: RecordMilestoneDTO): Promise<Result<any>> {
    try {
      // ── DB-driven dependency check ──────────────────────────────────────
      // Find the milestone definition matching this milestone_type
      const milestoneDef = await db.milestone_definition.findFirst({
        where: { milestone_code: data.milestone_type, is_active: true },
        include: {
          milestone_dependency_milestone_dependency_milestone_idTomilestone_definition: {
            include: {
              milestone_definition_milestone_dependency_required_milestone_idTomilestone_definition: true
            }
          }
        }
      })

      if (milestoneDef) {
        const deps = milestoneDef.milestone_dependency_milestone_dependency_milestone_idTomilestone_definition
        const requiredDeps = deps.filter((d: any) => d.is_required)

        if (requiredDeps.length > 0) {
          // Fetch completed milestones for this entity
          const existingHistory = await this.getHistory(data.entity_type, data.entity_id)
          const existingTypes = new Set(
            existingHistory.isSuccess
              ? existingHistory.value.map((m: any) => m.milestone_type)
              : []
          )

          const missing = requiredDeps.filter(
            (dep: any) => !existingTypes.has(
              dep.milestone_definition_milestone_dependency_required_milestone_idTomilestone_definition.milestone_code
            )
          )

          if (missing.length > 0) {
            const missingLabels = missing
              .map((d: any) => d.milestone_definition_milestone_dependency_required_milestone_idTomilestone_definition.name)
              .join(', ')
            return Fail(
              `Cannot record ${milestoneDef.name}. Missing prerequisite milestones: ${missingLabels}`
            )
          }
        }
      } else {
        // Fallback to static milestoneConfig
        const { milestoneConfig } = await import('@/core/config/milestone.config')
        const allDefs = [...milestoneConfig.CBA, ...milestoneConfig.DP]
        const fallbackDef = allDefs.find(m => m.id === data.milestone_type)
        if (fallbackDef && (fallbackDef as any).requires && (fallbackDef as any).requires.length > 0) {
          const existingHistory = await this.getHistory(data.entity_type, data.entity_id)
          const existingTypes = new Set(
            existingHistory.isSuccess
              ? existingHistory.value.map((m: any) => m.milestone_type)
              : []
          )
          const missing = (fallbackDef as any).requires.filter((reqId: string) => !existingTypes.has(reqId))
          if (missing.length > 0) {
            const missingLabels = missing
              .map((reqId: string) => allDefs.find(m => m.id === reqId)?.label || reqId)
              .join(', ')
            return Fail(
              `Cannot record ${fallbackDef.label}. Missing prerequisite milestones: ${missingLabels}`
            )
          }
        }
      }

      // ── Persist ─────────────────────────────────────────────────────────
      const milestone = await (db as any).manual_milestone.create({
        data: {
          entity_type: data.entity_type,
          entity_id: data.entity_id,
          milestone_type: data.milestone_type,
          authority_name: data.authority,
          reference_no: data.reference_no,
          sent_at: data.milestone_date,
          received_at: data.milestone_date,
          outcome: data.outcome,
          remarks: data.remarks,
          document_id: data.proof_document_id,
          entry_by: data.user_id,
        }
      })

      Audit.logCustomAction({
        activity: `[MILESTONE_RECORDED] on MANUAL_MILESTONE (${milestone?.id ?? 'created'}) | ${JSON.stringify({ milestone: data.milestone_type, entity: data.entity_id, outcome: data.outcome })}`,
        userId: data.user_id || 'system'
      }).catch(console.error)

      // Dispatch event to WorkflowReactionService (decoupled)
      const { workflowReactionService } = await import('./WorkflowReactionService')
      workflowReactionService.handleEvent('milestone_recorded', {
        entityType: data.entity_type,
        entityId: data.entity_id,
        data: {
          milestone_code: data.milestone_type,
          outcome: data.outcome,
          user_id: data.user_id,
        },
      }).catch(err => console.error('WorkflowReaction error:', err))

      return Ok(milestone)
    } catch (e: any) {
      console.error('ManualMilestoneService.recordMilestone error:', e)
      return Fail(e.message)
    }
  }

  async getHistory(entityType: string, entityId: string): Promise<Result<any[]>> {
    try {
      const records = await (db as any).manual_milestone.findMany({
        where: { entity_type: entityType, entity_id: entityId },
        orderBy: { sent_at: 'asc' }
      })
      return Ok(records)
    } catch (e: any) {
      console.error('ManualMilestoneService.getHistory error:', e)
      return Fail(e.message)
    }
  }

  /**
   * Load milestone definitions for a module from the DB.
   * Returns ordered list with dependency info for UI rendering.
   */
  async getDefinitionsForModule(moduleCode: string, entityType?: string): Promise<Result<any[]>> {
    try {
      // Allow mode-specific module_code (e.g. 'LAND_SCHEDULE_CBA_ACT', 'LAND_SCHEDULE_1') with fallback to base ('LAND_SCHEDULE')
      const targetCodes = [moduleCode]
      if (moduleCode.includes('_')) {
        const parts = moduleCode.split('_')
        const baseCode = parts[0]
        if (baseCode && !targetCodes.includes(baseCode)) {
          targetCodes.push(baseCode)
        }
      }

      const defs = await db.milestone_definition.findMany({
        where: {
          module_code: { in: targetCodes },
          is_active: true,
          ...(entityType ? { entity_type: entityType } : {})
        },
        include: {
          milestone_dependency_milestone_dependency_milestone_idTomilestone_definition: {
            include: {
              milestone_definition_milestone_dependency_required_milestone_idTomilestone_definition: {
                select: { milestone_code: true, name: true }
              }
            }
          }
        },
        orderBy: { entry_ts: 'asc' }
      })

      const mapped = defs.map((d: any) => ({
        id: d.milestone_code,
        label: d.name,
        description: d.description,
        module_code: d.module_code,
        entity_type: d.entity_type,
        requires: d.milestone_dependency_milestone_dependency_milestone_idTomilestone_definition
          .filter((dep: any) => dep.is_required)
          .map((dep: any) => dep.milestone_definition_milestone_dependency_required_milestone_idTomilestone_definition.milestone_code),
      }))

      return Ok(mapped)
    } catch (e: any) {
      console.error('ManualMilestoneService.getDefinitionsForModule error:', e)
      return Fail(e.message)
    }
  }
}

export const manualMilestoneService = new ManualMilestoneService()
