import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result } from '@/core/result/Result'
import { IChecklistRepository } from '../interfaces/IChecklistRepository'
import { ChecklistContextRegistry } from '../registry/ChecklistContextRegistry'
import { GeneratedDocumentChecklistAdapter } from '../services/GeneratedDocumentChecklistAdapter'
import { workflowTargetResolverRegistry } from '@/core/workflow/resolvers/WorkflowTargetResolverRegistry'
import { db } from '@/lib/db'

export interface GetChecklistStatusRequest {
  moduleCode: string;
  checkableType: string;
  checkableId: string;
}

export interface ChecklistStageDTO {
  code: string;
  label: string;
  order: number;
  status: 'COMPLETED' | 'CURRENT';
  isReadOnly: boolean;
  items: any[];
}

/**
 * Helper: Resolve field aliases across camelCase and snake_case representations
 */
function getContextFieldValue(context: Record<string, any>, field: string): any {
  if (context[field] !== undefined) return context[field];
  
  if (field === 'acq_mode' || field === 'acq_mode_id' || field === 'acqModeId') {
    return context.acq_mode ?? context.acq_mode_id ?? context.acqModeId;
  }
  if (field === 'current_stage_cd' || field === 'stage_code' || field === 'stage' || field === 'workflowState') {
    return context.current_stage_cd ?? context.stage ?? context.stage_code ?? context.currentStateCode;
  }
  if (field === 'has_forest_land' || field === 'hasForestLand') {
    return context.has_forest_land ?? context.hasForestLand ?? false;
  }
  if (field === 'has_tenancy_land' || field === 'hasTenancyLand') {
    return context.has_tenancy_land ?? context.hasTenancyLand ?? false;
  }
  if (field === 'has_government_or_patta_land' || field === 'hasGovernmentOrPattaLand') {
    return context.has_government_or_patta_land ?? context.hasGovernmentOrPattaLand ?? false;
  }
  if (field === 'reconciliation_required' || field === 'reconciliationRequired') {
    return context.reconciliation_required ?? context.reconciliationRequired ?? context.has_adjacent_mines ?? true;
  }

  return undefined;
}

/**
 * Helper: Recursive AST Evaluator for show_if rules
 */
function evaluateConditionNode(node: any, context: Record<string, any>): boolean {
  if (!node || typeof node !== 'object') return true;

  // 1. Handle logical 'and' array
  if (Array.isArray(node.and)) {
    return node.and.every((child: any) => evaluateConditionNode(child, context));
  }

  // 2. Handle logical 'or' array
  if (Array.isArray(node.or)) {
    return node.or.some((child: any) => evaluateConditionNode(child, context));
  }

  // 3. Leaf condition with explicit 'field' property
  const fieldName = node.field;
  const op = node.op || 'eq';
  const expectedValue = node.value;

  if (fieldName) {
    let actualValue = getContextFieldValue(context, fieldName);
    if (typeof actualValue === 'bigint') actualValue = Number(actualValue);

    switch (op) {
      case 'eq':
        return actualValue == expectedValue || String(actualValue) === String(expectedValue);
      case 'neq':
        return actualValue != expectedValue && String(actualValue) !== String(expectedValue);
      case 'in':
        return Array.isArray(expectedValue) && expectedValue.some(v => v == actualValue || String(v) === String(actualValue));
      case 'notin':
        return Array.isArray(expectedValue) && !expectedValue.some(v => v == actualValue || String(v) === String(actualValue));
      default:
        return true;
    }
  }

  // 4. Fallback for legacy flat key-value map e.g. { acqModeId: [1, 2, 6] }
  return Object.entries(node).every(([k, v]) => {
    let actualValue = getContextFieldValue(context, k);
    if (typeof actualValue === 'bigint') actualValue = Number(actualValue);

    if (Array.isArray(v)) {
      return v.some((item: any) => item == actualValue || String(item) === String(actualValue));
    }
    return actualValue == v || String(actualValue) === String(v);
  });
}

/**
 * Helper: Extract target stage code from show_if rule if specified
 */
function extractTargetStageCode(node: any): string | null {
  if (!node || typeof node !== 'object') return null;
  if (Array.isArray(node.and)) {
    for (const child of node.and) {
      const res = extractTargetStageCode(child);
      if (res) return res;
    }
  }
  if (node.field === 'current_stage_cd' || node.field === 'stage_code' || node.field === 'stage') {
    return Array.isArray(node.value) ? String(node.value[0]) : String(node.value);
  }
  if (node.current_stage_cd || node.stage_code || node.stage) {
    const val = node.current_stage_cd || node.stage_code || node.stage;
    return Array.isArray(val) ? String(val[0]) : String(val);
  }
  return null;
}

export class GetChecklistStatusUseCase implements IUseCase<GetChecklistStatusRequest, any> {
  constructor(
    private repo: IChecklistRepository,
    private registry: ChecklistContextRegistry,
    private documentAdapter?: GeneratedDocumentChecklistAdapter
  ) {}

  async execute(req: GetChecklistStatusRequest): Promise<Result<any>> {
    try {
      // 1. Resolve dynamic context from the module & target resolver
      const resolver = this.registry.getResolver(req.moduleCode);
      const context = await resolver.resolve(req.checkableId);

      // Resolve entity current workflow state (e.g. current_stage_cd)
      const entityStatus = await workflowTargetResolverRegistry.resolveStatus(
        req.moduleCode,
        req.checkableType,
        req.checkableId
      );

      const currentStateCode = context.current_stage_cd || context.currentStateCode || entityStatus?.currentStateCode || 'Drafting';
      context.current_stage_cd = currentStateCode;
      context.currentStateCode = currentStateCode;
      context.workflowState = currentStateCode;

      // 2. Fetch workflow states for stage ordering & visibility
      const workflowCode = entityStatus?.workflowCode || req.moduleCode;
      const dbStates = await db.workflow_states.findMany({
        where: { workflow_code: workflowCode },
        orderBy: { step_order: 'asc' }
      });

      const currentStateObj = dbStates.find(s => s.state_code === currentStateCode);
      const currentStepOrder = currentStateObj ? Number(currentStateObj.step_order) : 1.0;

      // Build visible stages array (completed historical stages + current stage; future stages HIDDEN)
      const visibleStageMap = new Map<string, ChecklistStageDTO>();
      for (const st of dbStates) {
        const stepOrder = Number(st.step_order);
        if (stepOrder <= currentStepOrder) {
          const isCurrent = st.state_code === currentStateCode || stepOrder === currentStepOrder;
          visibleStageMap.set(st.state_code, {
            code: st.state_code,
            label: st.label,
            order: stepOrder,
            status: isCurrent ? 'CURRENT' : 'COMPLETED',
            isReadOnly: !isCurrent,
            items: []
          });
        }
      }

      // 3. Fetch active rules & submissions
      const rules = await this.repo.findRulesByModule(req.moduleCode);
      const submissions = await this.repo.findSubmissions(req.checkableType, req.checkableId);
      const submissionsByReqId = new Map(submissions.map(s => [s.requirement_id, s]));

      const items: any[] = [];
      let isComplete = true;

      for (const rule of rules) {
        // 4. Evaluate show_if dynamically with recursive AST evaluator
        let shouldShow = true;
        let ruleTargetStageCode: string | null = null;

        if (rule.show_if) {
          shouldShow = evaluateConditionNode(rule.show_if, context);
          ruleTargetStageCode = extractTargetStageCode(rule.show_if);
        }

        // Hide future stage items completely if workflow states exist
        if (ruleTargetStageCode && dbStates.length > 0) {
          const targetStateObj = dbStates.find(s => s.state_code === ruleTargetStageCode);
          if (targetStateObj && Number(targetStateObj.step_order) > currentStepOrder) {
            shouldShow = false;
          }
        }

        if (!shouldShow) continue;

        let submission = submissionsByReqId.get((rule as any).chk_id || rule.id);

        // 5. Auto-Fetch Inheritance
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

        const itemDTO = {
          ruleId: (rule as any).chk_id || rule.id,
          chkCode: rule.chk_code,
          title: rule.title,
          description: rule.description,
          type: rule.requirement_type,
          inputSchema: rule.input_schema,
          isMandatory: rule.is_mandatory,
          stageCode: ruleTargetStageCode || currentStateCode,
          generatedDocInfo,
          submission: submission ? {
            status: submission.status,
            documentId: submission.document_id,
            userInput: submission.user_input,
            updtTs: submission.updt_ts
          } : null
        };

        items.push(itemDTO);

        // Group into visible stage if available
        const targetStageCode = ruleTargetStageCode || currentStateCode;
        if (visibleStageMap.has(targetStageCode)) {
          visibleStageMap.get(targetStageCode)!.items.push(itemDTO);
        } else if (visibleStageMap.has(currentStateCode)) {
          visibleStageMap.get(currentStateCode)!.items.push(itemDTO);
        }
      }

      const visibleStages = Array.from(visibleStageMap.values());

      return Result.ok({
        isComplete,
        currentStage: {
          code: currentStateCode,
          label: currentStateObj?.label || currentStateCode,
          stepOrder: currentStepOrder
        },
        stages: visibleStages,
        items
      });
    } catch (error: any) {
      console.error('[GetChecklistStatusUseCase] execution error:', error);
      return Result.fail(error.message);
    }
  }
}
