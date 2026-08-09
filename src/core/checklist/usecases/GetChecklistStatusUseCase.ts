import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result } from '@/core/result/Result'
import { IChecklistRepository } from '../interfaces/IChecklistRepository'
import { ChecklistContextRegistry } from '../registry/ChecklistContextRegistry'
import { GeneratedDocumentChecklistAdapter } from '../services/GeneratedDocumentChecklistAdapter'

export interface GetChecklistStatusRequest {
  moduleCode: string;
  checkableType: string;
  checkableId: string;
}

export class GetChecklistStatusUseCase implements IUseCase<GetChecklistStatusRequest, any> {
  constructor(
    private repo: IChecklistRepository,
    private registry: ChecklistContextRegistry,
    private documentAdapter?: GeneratedDocumentChecklistAdapter
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
            // Fix: Cast BigInt to Number for JSON evaluation
            let contextValue = context[key];
            if (typeof contextValue === 'bigint') {
              contextValue = Number(contextValue);
            }
            
            // Simple strict equality evaluator (can be replaced by json-rules-engine later)
            if (Array.isArray(value)) {
              if (!value.includes(contextValue)) shouldShow = false;
            } else {
              if (contextValue !== value) shouldShow = false;
            }
          }
        }

        if (!shouldShow) continue;

        let submission = submissionsByReqId.get((rule as any).chk_id || rule.id);
        
        // 5. Handle Auto-Fetch Inheritance bidirectionality
        if (!submission && rule.inherit_from) {
           const inheritConfig = rule.inherit_from as any;
           if (inheritConfig.parent_checkable_type && context.parentId) {
               const targetRuleId = inheritConfig.parent_rule_id || (rule as any).chk_id || rule.id;
               const parentSubmission = await this.repo.findSubmission(targetRuleId, inheritConfig.parent_checkable_type, context.parentId);
               if (parentSubmission) {
                   submission = { ...parentSubmission, status: 'AUTO_SATISFIED' };
               }
           }
        }

        let isSatisfied = submission?.status === 'SUBMITTED' || submission?.status === 'AUTO_SATISFIED' || submission?.status === 'APPROVED';
        let generatedDocInfo: any = undefined;

        // 6. Generated Document Type override
        if (rule.input_schema?.type === 'generated_document' && this.documentAdapter) {
          const docResult = await this.documentAdapter.resolveStatus(rule, req.checkableType, req.checkableId, submission);
          if (docResult.newlySubmitted) {
             // Refresh submission
             submission = { status: 'SUBMITTED', document_id: docResult.generatedDocInfo.generatedDocId };
             isSatisfied = true;
          } else {
             isSatisfied = docResult.status === 'complete';
          }
          generatedDocInfo = docResult.generatedDocInfo;
        }

        if (rule.is_mandatory && !isSatisfied) {
          isComplete = false;
        }

        items.push({
          ruleId: (rule as any).chk_id || rule.id,
          chkCode: rule.chk_code,
          title: rule.title,
          description: rule.description,
          type: rule.requirement_type,
          inputSchema: rule.input_schema,
          isMandatory: rule.is_mandatory,
          generatedDocInfo,
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
