import { db } from '@/lib/db'
import { IChecklistRepository } from '@/core/checklist/interfaces/IChecklistRepository'
import { v4 as uuidv4 } from 'uuid'

export class PrismaChecklistRepository implements IChecklistRepository {
  async findRulesByModule(moduleCode: string) {
    return db.checklist_requirement_rule.findMany({
      where: { module_code: moduleCode, is_active: true },
      orderBy: { display_order: 'asc' }
    })
  }

  async findSubmissions(checkableType: string, checkableId: string) {
    return db.checklist_submission.findMany({
      where: { checkable_type: checkableType, checkable_id: checkableId }
    })
  }

  async findSubmission(requirementId: string, checkableType: string, checkableId: string) {
    return db.checklist_submission.findFirst({
      where: { requirement_id: requirementId, checkable_type: checkableType, checkable_id: checkableId }
    })
  }

  async upsertSubmission(data: {
    requirement_id: string;
    checkable_type: string;
    checkable_id: string;
    status: string;
    document_id?: string;
    user_input?: any;
    respondent_context?: any;
    entry_by?: string;
  }) {
    const existing = await this.findSubmission(data.requirement_id, data.checkable_type, data.checkable_id);
    if (existing) {
      return db.checklist_submission.update({
        where: { id: existing.id },
        data: {
          status: data.status,
          document_id: data.document_id ?? existing.document_id,
          user_input: data.user_input ?? existing.user_input,
          updt_by: data.entry_by
        }
      })
    } else {
      return db.checklist_submission.create({
        data: {
          id: uuidv4(),
          ...data
        }
      })
    }
  }
}
