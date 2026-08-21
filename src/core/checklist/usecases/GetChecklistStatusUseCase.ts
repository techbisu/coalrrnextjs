import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result } from '@/core/result/Result'
import { IChecklistRepository } from '../interfaces/IChecklistRepository'
import { ChecklistContextRegistry } from '../registry/ChecklistContextRegistry'
import { GeneratedDocumentChecklistAdapter } from '../services/GeneratedDocumentChecklistAdapter'
import { workflowTargetResolverRegistry } from '@/core/workflow/resolvers/WorkflowTargetResolverRegistry'
import type { IWorkflowStateRepository } from '@/core/workflow/interfaces/IWorkflowStateRepository'

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
 * Helper: Normalizes a string by converting it to lowercase and removing all underscores.
 * This bridges camelCase, snake_case, and other casing variations.
 */
function normalizeString(str: string): string {
  return str.replace(/_/g, '').toLowerCase();
}

/**
 * Helper: Resolve field aliases across camelCase, snake_case, and semantic representations
 */
function getContextFieldValue(context: Record<string, any>, field: string): any {
  if (context[field] !== undefined) return context[field];
  
  const normalizedField = normalizeString(field);
  
  // 1. Check for exact match under normalized casing
  for (const [key, value] of Object.entries(context)) {
    if (normalizeString(key) === normalizedField) {
      return value;
    }
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
  if (node.field === 'current_stage_cd' || node.field === 'stage_code' || node.field === 'stage' || node.field === 'current_state') {
    return Array.isArray(node.value) ? String(node.value[0]) : String(node.value);
  }
  if (node.current_stage_cd || node.stage_code || node.stage || node.current_state) {
    const val = node.current_stage_cd || node.stage_code || node.stage || node.current_state;
    return Array.isArray(val) ? String(val[0]) : String(val);
  }
  return null;
}

export class GetChecklistStatusUseCase implements IUseCase<GetChecklistStatusRequest, any> {
  constructor(
    private repo: IChecklistRepository,
    private registry: ChecklistContextRegistry,
    private documentAdapter?: GeneratedDocumentChecklistAdapter,
    private workflowStateRepo?: IWorkflowStateRepository
  ) {}

  async execute(req: GetChecklistStatusRequest): Promise<Result<any>> {
    try {
      // 1. Resolve dynamic context from the module & target resolver
      const resolver = this.registry.getResolver(req.moduleCode);
      const context = await resolver.resolve(req.checkableId);

      // Resolve entity current workflow state (e.g. current_stage_cd)
      const entityStatus = await workflowTargetResolverRegistry
        .resolveStatus(req.moduleCode, req.checkableType, req.checkableId)
        .catch(() => null);

      const currentStateCode = context.current_stage_cd || context.currentStateCode || entityStatus?.currentStateCode || 'Drafting';
      context.current_stage_cd = currentStateCode;
      context.currentStateCode = currentStateCode;
      context.workflowState = currentStateCode;

      // 2. Fetch workflow states for stage ordering & visibility
      const workflowCode = entityStatus?.workflowCode || req.moduleCode;
      let dbStates: any[] = [];
      try {
        if (this.workflowStateRepo) {
          dbStates = await this.workflowStateRepo.findActiveByWorkflowCode(workflowCode);
        } else {
          const { PrismaWorkflowStateRepository } = await import('@/infrastructure/persistence/repositories/PrismaWorkflowStateRepository');
          dbStates = await new PrismaWorkflowStateRepository().findActiveByWorkflowCode(workflowCode);
        }
      } catch {
        dbStates = [];
      }

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

        // Auto-Evaluation for Plot Schedule from ConditionContext facts
        const chkCodeUpper = (rule.chk_code || '').toUpperCase();
        const isPlotScheduleRule = chkCodeUpper.includes('PLOT') || rule.input_schema?.auto_eval_fact === 'plot_count';

        if (!submission && isPlotScheduleRule && (Number(context.plot_count || 0) > 0 || context.has_plots === true)) {
          submission = {
            status: 'AUTO_SATISFIED',
            user_input: { autoEvaluated: true, plotCount: context.plot_count }
          } as any;
        }

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

        // 6. Generated Document Type override
        const isGeneratedDocument =
          rule.requirement_type === 'generated_document' ||
          rule.requirement_type === 'GENERATED_DOCUMENT' ||
          rule.input_schema?.type === 'generated_document' ||
          Boolean(rule.input_schema?.template_code || rule.input_schema?.templateCode || rule.input_schema?.document_code);

        // Gap 3.3: Contextual cloning for MULTI_TARGET
        let virtualRules = [ { rule, contextId: undefined, suffix: '' } ];
        
        if (isGeneratedDocument && rule.input_schema?.context_source === 'adjacent_mine_cds') {
          const cds = context.cross_colliery_cds || context.adjacent_mine_cds || [];
          if (Array.isArray(cds) && cds.length > 0) {
            virtualRules = cds.map(cd => ({
              rule: { ...rule, id: `${rule.id}_${cd}`, chk_id: `${(rule as any).chk_id || rule.id}_${cd}` },
              contextId: cd,
              suffix: ` (Mine: ${cd})`
            }));
          }
        }

        for (const { rule: vRule, contextId, suffix } of virtualRules) {
          let vSubmission = submissionsByReqId.get((vRule as any).chk_id || vRule.id) || submission;
          let vIsSatisfied = vSubmission?.status === 'SUBMITTED' || vSubmission?.status === 'AUTO_SATISFIED' || vSubmission?.status === 'APPROVED';
          let generatedDocInfo: any = undefined;

          if (isGeneratedDocument && this.documentAdapter) {
            // Support passing contextId to adapter
            const docResult = await (this.documentAdapter as any).resolveStatusWithContext(
              vRule, req.checkableType, req.checkableId, vSubmission, (req as any).userPermissions || [], currentStateCode, contextId
            ).catch(() => this.documentAdapter!.resolveStatus(vRule, req.checkableType, req.checkableId, vSubmission, (req as any).userPermissions || [], currentStateCode));
            
            if (docResult.newlySubmitted) {
              vSubmission = { status: 'SUBMITTED', document_id: docResult.generatedDocInfo.generatedDocId };
              vIsSatisfied = true;
            } else {
              vIsSatisfied = docResult.status === 'complete';
            }
            generatedDocInfo = docResult.generatedDocInfo;
          }

          if (vRule.is_required && !vIsSatisfied) {
            isComplete = false;
          }

          // Compute satisfaction reason
          const satisfactionReason: string | undefined = (() => {
            if (!vIsSatisfied) return undefined;
            if (generatedDocInfo?.status === 'COMPLETED') return 'DOC_COMPLETED';
            const s = vSubmission?.status;
            if (s === 'AUTO_SATISFIED') return 'AUTO_SATISFIED';
            if (s === 'SUBMITTED') return 'SUBMITTED';
            if (s === 'APPROVED') return 'APPROVED';
            return 'SATISFIED';
          })();

          const itemDTO = {
            ruleId: (vRule as any).chk_id || vRule.id,
            chkCode: vRule.chk_code,
            label: (vRule.label || vRule.chk_name) + suffix,
            description: vRule.description || '',
            type: vRule.requirement_type || rule.input_schema?.type || 'user_input',
            inputSchema: vRule.input_schema,
            isMandatory: vRule.is_required || vRule.is_mandatory,
            stageCode: ruleTargetStageCode || currentStateCode,
            isSatisfied: vIsSatisfied,
            satisfactionReason,
            generatedDocInfo,
            contextId,
            submission: vSubmission ? {
              status: vSubmission.status,
              documentId: vSubmission.document_id,
              userInput: vSubmission.user_input,
              rejectionReason: vSubmission.rejection_reason
            } : null
          };

          items.push(itemDTO);
          
          if (ruleTargetStageCode && visibleStageMap.has(ruleTargetStageCode)) {
            visibleStageMap.get(ruleTargetStageCode)!.items.push(itemDTO);
          } else if (visibleStageMap.has(currentStateCode)) {
            visibleStageMap.get(currentStateCode)!.items.push(itemDTO);
          }
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
