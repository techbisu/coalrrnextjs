/**
 * WorkflowActionHistoryService (COALRR spec §2.3).
 *
 * Polymorphic, module-agnostic service for recording and querying workflow state
 * transition history across any module (land_schedule, compensation_payroll, etc.).
 *
 * Integrates with:
 *  - public.workflow_action_history (Transition history & justification remarks)
 *  - public.file_attachment (Polymorphic file links to file_record)
 *  - public.user (Actor user profile relation)
 */
import { db } from '@/lib/db'
import { normalizeModuleCode, getEntityTypeForModule, CanonicalModuleCode } from '@/core/config/module-codes.config'

export interface RecordActionInput {
  moduleCode?: string
  entityType?: string
  entityId: string
  workflowCode?: string
  action: string
  fromState: string
  toState: string
  userId?: number
  userEmail?: string
  comments?: string
  documentId?: string
}

export class WorkflowActionHistoryService {
  /**
   * Records a workflow state transition event & links attachment in public.file_attachment if documentId provided.
   */
  async recordAction(input: RecordActionInput): Promise<string> {
    const canonicalCode: CanonicalModuleCode = normalizeModuleCode(input.moduleCode || input.workflowCode || input.entityType)
    const entityType = input.entityType || getEntityTypeForModule(canonicalCode)

    const history = await (db as any).workflow_action_history.create({
      data: {
        entity_type: entityType,
        entity_id: input.entityId,
        workflow_code: canonicalCode,
        action: input.action,
        from_state: input.fromState,
        to_state: input.toState,
        user_id: input.userId || null,
        comments: input.comments || null,
        entry_by: input.userEmail || 'system',
        updt_by: input.userEmail || 'system'
      }
    })

    // If a document was uploaded, register attachment link in File Manager's file_attachment table
    if (input.documentId) {
      await (db as any).file_attachment.upsert({
        where: {
          file_id_entity_type_entity_id: {
            file_id: input.documentId,
            entity_type: 'workflow_action_history',
            entity_id: history.wah_id
          }
        },
        create: {
          id: `att_${history.wah_id}`,
          file_id: input.documentId,
          entity_type: 'workflow_action_history',
          entity_id: history.wah_id,
          module: 'WORKFLOW_JUSTIFICATION',
          attached_by: input.userEmail || 'system',
          entry_by: input.userEmail || 'system',
          updt_by: input.userEmail || 'system',
          updt_ts: new Date()
        },
        update: {
          updt_ts: new Date()
        }
      })
    }

    return history.wah_id
  }

  /**
   * Fetches full timeline history for any module entity including user details and file_attachment attachments.
   */
  async getHistoryForEntity(rawModuleCode: string, entityId: string) {
    const canonicalCode = normalizeModuleCode(rawModuleCode)
    const entityType = getEntityTypeForModule(canonicalCode)

    const historyRecords = await (db as any).workflow_action_history.findMany({
      where: {
        OR: [
          { entity_type: entityType, entity_id: entityId },
          { workflow_code: canonicalCode, entity_id: entityId }
        ]
      },
      orderBy: { entry_ts: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, designation: true, mobile: true }
        }
      }
    })

    // Hydrate justification file attachments from public.file_attachment
    const wahIds = historyRecords.map((h: any) => h.wah_id)
    const attachments = await (db as any).file_attachment.findMany({
      where: {
        entity_type: 'workflow_action_history',
        entity_id: { in: wahIds }
      },
      include: {
        file_record: {
          select: { id: true, original_name: true, status: true }
        }
      }
    })

    const attachmentMap = new Map(attachments.map((a: any) => [a.entity_id, a.file_record]))

    return historyRecords.map((record: any) => ({
      ...record,
      attachment: attachmentMap.get(record.wah_id) || null
    }))
  }
}

export const workflowActionHistoryService = new WorkflowActionHistoryService()
