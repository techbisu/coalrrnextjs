import { db } from '@/lib/db'
import { IChecklistRepository } from '@/core/checklist/interfaces/IChecklistRepository'
import { v4 as uuidv4 } from 'uuid'

import { ConfigCacheService } from '@/core/config/cache/ConfigCacheService'
import { ACQ_LAND_SCHEDULE } from '@/core/config/module-codes.config'

export class PrismaChecklistRepository implements IChecklistRepository {
  async findRulesByModule(moduleCode: string) {
    return ConfigCacheService.getChecklistRules(moduleCode)
  }

  private normalizeTypes(checkableType: string): string[] {
    if (checkableType === ACQ_LAND_SCHEDULE || checkableType.toLowerCase().includes('schedule') || checkableType.toLowerCase().includes('proposal')) {
      return [ACQ_LAND_SCHEDULE, 'land_schedule', 'acq_proposal', 'proposal', 'PROPOSAL', 'LAND_ACQ_PROPOSAL']
    }
    return [checkableType]
  }

  async findSubmissions(checkableType: string, checkableId: string) {
    const types = this.normalizeTypes(checkableType);
    return db.checklist_submission.findMany({
      where: {
        checkable_type: { in: types },
        checkable_id: checkableId
      }
    })
  }

  async findSubmission(requirementId: string, checkableType: string, checkableId: string) {
    const types = this.normalizeTypes(checkableType);
    return db.checklist_submission.findFirst({
      where: {
        requirement_id: requirementId,
        checkable_type: { in: types },
        checkable_id: checkableId
      }
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
