import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result } from '@/core/result/Result'
import { IChecklistRepository } from '../interfaces/IChecklistRepository'
import { ChecklistContextRegistry } from '../registry/ChecklistContextRegistry'

export interface UpdateChecklistSubmissionRequest {
  moduleCode: string;
  requirementId: string;
  checkableType: string;
  checkableId: string;
  documentId?: string;
  userInput?: any;
  userId: string;
}

export class UpdateChecklistSubmissionUseCase implements IUseCase<UpdateChecklistSubmissionRequest, any> {
  constructor(
    private repo: IChecklistRepository,
    private registry: ChecklistContextRegistry
  ) {}

  async execute(req: UpdateChecklistSubmissionRequest): Promise<Result<any>> {
    try {
      let targetType = req.checkableType;
      let targetId = req.checkableId;

      // Determine if we need to sync to parent (Bidirectional Inheritance)
      const rules = await this.repo.findRulesByModule(req.moduleCode);
      console.log(`[UpdateChecklist] req.requirementId = ${req.requirementId}`);
      console.log(`[UpdateChecklist] rules =`, rules.map(r => ({ chk_id: (r as any).chk_id, id: (r as any).id, chk_code: r.chk_code })));
      const rule = rules.find(r => r.id === req.requirementId || (r as any).chk_id === req.requirementId);
      
      if (!rule) {
        return Result.fail('Checklist rule not found');
      }

      if (rule.sync_to_parent) {
        const syncConfig = rule.sync_to_parent as any;
        if (syncConfig.parent_type) {
          const resolver = this.registry.getResolver(req.moduleCode);
          const context = await resolver.resolve(req.checkableId);
          if (context.parentId) {
            targetType = syncConfig.parent_type;
            targetId = context.parentId;
          }
        }
      }

      const submission = await this.repo.upsertSubmission({
        requirement_id: req.requirementId,
        checkable_type: targetType,
        checkable_id: targetId,
        status: 'SUBMITTED',
        document_id: req.documentId,
        user_input: req.userInput,
        entry_by: req.userId
      });

      return Result.ok(submission);
    } catch (error: any) {
      return Result.fail(error.message);
    }
  }
}
