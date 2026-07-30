import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result } from '@/core/result/Result'
import { IChecklistRepository } from '../interfaces/IChecklistRepository'
import { ChecklistContextRegistry } from '../registry/ChecklistContextRegistry'

export interface GetChecklistStatusRequest {
  moduleCode: string;
  checkableType: string;
  checkableId: string;
}

export class GetChecklistStatusUseCase implements IUseCase<GetChecklistStatusRequest, any> {
  constructor(
    private repo: IChecklistRepository,
    private registry: ChecklistContextRegistry
  ) {}

  async execute(req: GetChecklistStatusRequest): Promise<Result<any>> {
    try {
      // 1. Resolve dynamic context from the module
      const resolver = this.registry.getResolver(req.moduleCode);
      const context = await resolver.resolve(req.checkableId);

      // 2. Fetch active rules for the module
      const rules = await this.repo.findRulesByModule(req.moduleCode);

      // 3. Fetch current submissions for this entity
      const submissions = await this.repo.findSubmissions(req.checkableType, req.checkableId);
      const submissionsByReqId = new Map(submissions.map(s => [s.requirement_id, s]));

      const items: any[] = [];
      let isComplete = true;

      for (const rule of rules) {
        // 4. Evaluate show_if dynamically
        let shouldShow = true;
        if (rule.show_if) {
          const conditions = rule.show_if as Record<string, any>;
          for (const [key, value] of Object.entries(conditions)) {
            // Simple strict equality evaluator (can be replaced by json-rules-engine later)
            if (Array.isArray(value)) {
              if (!value.includes(context[key])) shouldShow = false;
            } else {
              if (context[key] !== value) shouldShow = false;
            }
          }
        }

        if (!shouldShow) continue;

        let submission = submissionsByReqId.get(rule.id);
        
        // 5. Handle Auto-Fetch Inheritance bidirectionality
        if (!submission && rule.inherit_from) {
           const inheritConfig = rule.inherit_from as any;
           if (inheritConfig.parent_checkable_type && context.parentId) {
               const parentSubmission = await this.repo.findSubmission(rule.id, inheritConfig.parent_checkable_type, context.parentId);
               if (parentSubmission) {
                   submission = { ...parentSubmission, status: 'AUTO_SATISFIED' };
               }
           }
        }

        const isSatisfied = submission?.status === 'SUBMITTED' || submission?.status === 'AUTO_SATISFIED' || submission?.status === 'APPROVED';
        if (rule.is_mandatory && !isSatisfied) {
          isComplete = false;
        }

        items.push({
          ruleId: rule.id,
          title: rule.title,
          description: rule.description,
          type: rule.requirement_type,
          inputSchema: rule.input_schema,
          isMandatory: rule.is_mandatory,
          submission: submission ? {
            status: submission.status,
            documentId: submission.document_id,
            userInput: submission.user_input,
            updtTs: submission.updt_ts
          } : null
        });
      }

      return Result.ok({ isComplete, items });
    } catch (error: any) {
      return Result.fail(error.message);
    }
  }
}
