import 'server-only';
import { db } from '@/lib/db';

export interface WorkflowEntityStatus {
  currentStateCode: string;
  workflowCode?: string;
  title?: string;
}

export interface TargetFulfillmentStatus {
  targetType: 'MILESTONE' | 'CHECKLIST' | 'DOCUMENT_SIGNATURE' | 'WORKFLOW_ACTION';
  targetCode: string;
  isFulfilled: boolean;
  label?: string;
}

export interface WorkflowTargetResolver {
  canResolve(moduleCode: string, entityType: string): boolean;
  resolveEntityStatus(moduleCode: string, entityType: string, entityId: string): Promise<WorkflowEntityStatus | null>;
}

class WorkflowTargetResolverRegistry {
  private resolvers: WorkflowTargetResolver[] = [];

  public registerResolver(resolver: WorkflowTargetResolver): void {
    this.resolvers.push(resolver);
  }

  public async resolveStatus(moduleCode: string, entityType: string, entityId: string): Promise<WorkflowEntityStatus> {
    for (const resolver of this.resolvers) {
      if (resolver.canResolve(moduleCode, entityType)) {
        const res = await resolver.resolveEntityStatus(moduleCode, entityType, entityId);
        if (res) return res;
      }
    }
    return {
      currentStateCode: 'Drafting',
      workflowCode: moduleCode,
      title: `${entityType}:${entityId}`,
    };
  }

  /**
   * Generic batch resolution of target fulfillment from authoritative target services (0 N+1 Queries).
   */
  public async resolveTargetFulfillmentBatch(
    entityType: string,
    entityId: string,
    targets: Array<{ targetType: 'MILESTONE' | 'CHECKLIST' | 'DOCUMENT_SIGNATURE' | 'WORKFLOW_ACTION'; targetCode: string }>
  ): Promise<Map<string, TargetFulfillmentStatus>> {
    const resultMap = new Map<string, TargetFulfillmentStatus>();
    if (!targets.length) return resultMap;

    const milestones = targets.filter((t) => t.targetType === 'MILESTONE');
    const checklists = targets.filter((t) => t.targetType === 'CHECKLIST');
    const docSigs = targets.filter((t) => t.targetType === 'DOCUMENT_SIGNATURE');
    const actions = targets.filter((t) => t.targetType === 'WORKFLOW_ACTION');

    const [milestoneRows, checklistRows, docRows, actionRows] = await Promise.all([
      milestones.length
        ? (db as any).manual_milestone?.findMany({
            where: { entity_id: entityId, milestone_code: { in: milestones.map((m) => m.targetCode) } },
          })
        : [],
      checklists.length
        ? (db as any).checklist_submission?.findMany({
            where: { checkable_id: entityId, requirement_code: { in: checklists.map((c) => c.targetCode) } },
          })
        : [],
      docSigs.length
        ? (db as any).document_instance?.findMany({
            where: { application_id: entityId, template_code: { in: docSigs.map((d) => d.targetCode) } },
          })
        : [],
      actions.length
        ? (db as any).workflow_action_history?.findMany({
            where: { entity_id: entityId, action: { in: actions.map((a) => a.targetCode) } },
          })
        : [],
    ]);

    const completedMilestones = new Map<string, any>((milestoneRows || []).map((m: any) => [m.milestone_code, m]));
    const checklistSubs = new Map<string, any>((checklistRows || []).map((c: any) => [c.requirement_code, c]));
    const docMap = new Map<string, any>((docRows || []).map((d: any) => [d.template_code, d]));
    const actionMap = new Map<string, any>((actionRows || []).map((a: any) => [a.action, a]));

    for (const t of targets) {
      const key = `${t.targetType}:${t.targetCode}`;
      if (t.targetType === 'MILESTONE') {
        const m = completedMilestones.get(t.targetCode);
        resultMap.set(key, {
          targetType: t.targetType,
          targetCode: t.targetCode,
          isFulfilled: m?.status === 'COMPLETED',
          label: m?.title || t.targetCode,
        });
      } else if (t.targetType === 'CHECKLIST') {
        const c = checklistSubs.get(t.targetCode);
        resultMap.set(key, {
          targetType: t.targetType,
          targetCode: t.targetCode,
          isFulfilled: ['COMPLETED', 'SUBMITTED', 'APPROVED'].includes(c?.status || ''),
          label: c?.requirement_title || t.targetCode,
        });
      } else if (t.targetType === 'DOCUMENT_SIGNATURE') {
        const d = docMap.get(t.targetCode);
        const sigs = (d?.signature_data_json as any[]) || [];
        resultMap.set(key, {
          targetType: t.targetType,
          targetCode: t.targetCode,
          isFulfilled: sigs.length > 0,
          label: `Signature ${t.targetCode}`,
        });
      } else if (t.targetType === 'WORKFLOW_ACTION') {
        const a = actionMap.get(t.targetCode);
        resultMap.set(key, {
          targetType: t.targetType,
          targetCode: t.targetCode,
          isFulfilled: !!a,
          label: t.targetCode.replace(/_/g, ' '),
        });
      }
    }

    return resultMap;
  }
}

export const workflowTargetResolverRegistry = new WorkflowTargetResolverRegistry();
