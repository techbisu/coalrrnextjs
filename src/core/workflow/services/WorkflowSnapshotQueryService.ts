import 'server-only';
import { db } from '@/lib/db';
import { workflowEngineServer } from '../WorkflowEngineServer';
import { workflowActionHistoryService } from './WorkflowActionHistoryService';
import { manualMilestoneService } from './ManualMilestoneService';
import { workflowTargetResolverRegistry } from '../resolvers/WorkflowTargetResolverRegistry';
import { Container } from '@/infrastructure/di/Container';
import type {
  WorkflowSnapshot,
  WorkflowAssignmentNode,
  WorkflowPendingAction,
  WorkflowTransitionOption,
  WorkflowActionItem,
} from '../types/snapshot.types';
import type { GuardContext, Transition } from '../types';

export class WorkflowSnapshotQueryService {
  /**
   * Constructs the canonical WorkflowSnapshot read model for an entity efficiently.
   */
  async getSnapshot(
    moduleCode: string,
    entityType: string,
    entityId: string,
    userContext: { userId?: string; role: string }
  ): Promise<WorkflowSnapshot> {
    // 1. Resolve entity status & target
    const targetStatus = await workflowTargetResolverRegistry.resolveStatus(
      moduleCode,
      entityType,
      entityId
    );

    const currentStateCode = targetStatus?.currentStateCode || 'Drafting';
    const entityWorkflowCode = targetStatus?.workflowCode || moduleCode;

    // 2. Fetch available state machine transitions for user context
    const guardContext: GuardContext = {
      recordType: moduleCode,
      recordId: entityId,
      actorRole: userContext.role,
      currentState: currentStateCode,
      workflowCode: entityWorkflowCode,
    };

    const allowedTransitions = await workflowEngineServer.getAvailableTransitionsAsync(guardContext);

    const availableTransitions: WorkflowTransitionOption[] = allowedTransitions.map((t: Transition) => ({
      transitionId: `tr-${t.from}-${t.to}-${t.name}`,
      name: t.name,
      label: t.label || t.name || `Move to ${t.to}`,
      fromState: t.from,
      toState: t.to,
      requiredRole: t.role,
      isAllowed: true,
    }));

    // 3. Parallel Execution of Independent Core Reads (Concurrent Promise.all)
    const [historyLogs, docInstances, milestonesResult, dbStates] = await Promise.all([
      workflowActionHistoryService.getHistoryForEntity(moduleCode, entityId),
      db.document_instance.findMany({
        where: { application_id: entityId },
        select: {
          id: true,
          template_code: true,
          signature_data_json: true,
          document_template: {
            select: { template_name: true },
          },
        },
      }),
      manualMilestoneService.getHistory(entityType, entityId),
      db.workflow_states.findMany({
        where: { workflow_code: entityWorkflowCode, is_active: true },
        select: {
          state_code: true,
          label: true,
          color: true,
          step_order: true,
          is_terminal: true,
        },
        orderBy: { step_order: 'asc' },
      }),
    ]);

    // 4. Batch Signature Rules Query (0 N+1 Queries)
    const templateCodes = Array.from(
      new Set(docInstances.map((d) => d.template_code).filter(Boolean) as string[])
    );

    const allSigRules = templateCodes.length
      ? await db.document_template_signature.findMany({
          where: { template_code: { in: templateCodes } },
          select: {
            template_code: true,
            sig_permission: true,
            display_order: true,
          },
          orderBy: { display_order: 'asc' },
        })
      : [];

    const sigRulesMap = new Map<string, typeof allSigRules>();
    for (const rule of allSigRules) {
      if (!sigRulesMap.has(rule.template_code)) {
        sigRulesMap.set(rule.template_code, []);
      }
      sigRulesMap.get(rule.template_code)!.push(rule);
    }

    // 5. Synthesize Pending Actions Stack (Plots, Checklist, Generated Documents, Signatures)
    const pendingActions: WorkflowPendingAction[] = [];

    // A. Plot Schedule Completeness (0 plots = PENDING action)
    if (entityType === 'acq_land_schedule' || moduleCode === 'LAND_SCHEDULE') {
      const plotCount = await db.plot_schedule.count({
        where: { proposal_id: entityId }
      });

      if (plotCount === 0) {
        pendingActions.push({
          id: `action-add-plot-${entityId}`,
          type: 'ACTION',
          code: 'ADD_PLOT_SCHEDULE',
          label: 'Add Plot Schedule',
          description: 'At least 1 plot schedule entry is required for proposal submission',
          status: 'PENDING',
          isAuthorizedForCurrentUser: true,
          metadata: { targetTab: 'plots' }
        });
      }
    }

    // B. Compliance Checklist Completeness
    if (Container.getChecklistStatusUseCase) {
      const checklistRes = await Container.getChecklistStatusUseCase.execute({
        moduleCode,
        checkableType: entityType,
        checkableId: entityId
      });

      if (checklistRes.isSuccess && checklistRes.value) {
        const items = checklistRes.value.items || [];
        const mandatoryItems = items.filter((i: any) => i.isMandatory);
        const satisfiedMandatory = mandatoryItems.filter((i: any) =>
          i.submission?.status === 'SUBMITTED' ||
          i.submission?.status === 'APPROVED' ||
          i.submission?.status === 'AUTO_SATISFIED' ||
          i.generatedDocInfo?.status === 'COMPLETED'
        );

        if (!checklistRes.value.isComplete && mandatoryItems.length > 0) {
          pendingActions.push({
            id: `action-checklist-${entityId}`,
            type: 'CHECKLIST',
            code: 'INITIAL_CHECKLIST',
            label: 'Complete Compliance Checklist',
            description: `${satisfiedMandatory.length}/${mandatoryItems.length} mandatory checklist items completed`,
            status: 'PENDING',
            isAuthorizedForCurrentUser: true,
            metadata: { targetTab: 'checklist' }
          });
        }

        // C. Un-generated Document Actions (e.g. Form-VII)
        const ungeneratedDocRules = items.filter((i: any) =>
          i.inputSchema?.type === 'generated_document' ||
          i.type === 'generated_document' ||
          i.inputSchema?.template_code ||
          i.inputSchema?.templateCode
        );

        for (const docRule of ungeneratedDocRules) {
          const tmplCode = docRule.inputSchema?.template_code || docRule.inputSchema?.templateCode || docRule.chkCode;
          const exists = docInstances.some(d => d.template_code === tmplCode);
          if (!exists) {
            pendingActions.push({
              id: `action-gen-doc-${tmplCode}-${entityId}`,
              type: 'GENERATED_DOCUMENT',
              code: `GENERATE_${tmplCode}`,
              label: `Generate & Sign ${docRule.title || tmplCode}`,
              description: docRule.description || `Required document ${tmplCode} must be generated`,
              status: 'PENDING',
              isAuthorizedForCurrentUser: true,
              metadata: { templateCode: tmplCode, targetTab: 'checklist' }
            });
          }
        }
      }
    }

    // D. Document Signatures for existing document instances
    for (const docInst of docInstances) {
      if (docInst.template_code) {
        const sigRules = sigRulesMap.get(docInst.template_code) || [];
        const sigDataJson = (docInst.signature_data_json as any[]) || [];
        const signedRoles = new Set(sigDataJson.map((s) => s.role || s.sig_permission));

        const nextSigRule = sigRules.find((r) => !signedRoles.has(r.sig_permission));
        if (nextSigRule) {
          const isUserAuthorizedToSign = userContext.role === nextSigRule.sig_permission;

          pendingActions.push({
            id: `sig-${docInst.id}-${nextSigRule.sig_permission}`,
            type: 'DOCUMENT_SIGNATURE',
            code: `SIGN_${docInst.template_code}`,
            label: `Sign ${docInst.document_template?.template_name || docInst.template_code} (${sigDataJson.length}/${sigRules.length} Signed)`,
            description: `Signature required by ${nextSigRule.sig_permission}`,
            status: isUserAuthorizedToSign ? 'PENDING' : 'BLOCKED',
            isAuthorizedForCurrentUser: isUserAuthorizedToSign,
            metadata: {
              documentInstanceId: docInst.id,
              templateCode: docInst.template_code,
              requiredRole: nextSigRule.sig_permission,
              signedCount: sigDataJson.length,
              totalSignatures: sigRules.length,
            },
          });
        }
      }
    }

    // 6. Extract & Batch Resolve Recommendations from Action History
    const rawRecs: any[] = [];
    const targetSet: Array<{ targetType: 'MILESTONE' | 'CHECKLIST' | 'DOCUMENT_SIGNATURE' | 'WORKFLOW_ACTION'; targetCode: string }> = [];

    for (const log of historyLogs) {
      if (log.recommendations_json) {
        const recList = Array.isArray(log.recommendations_json) ? log.recommendations_json : [log.recommendations_json];
        for (const r of recList) {
          const targetType = r.targetType || 'MILESTONE';
          const targetCode = r.targetCode || r.targetId || 'UNKNOWN';
          rawRecs.push({
            ...r,
            targetType,
            targetCode,
            sourceLogId: log.wah_id,
            sourceStateCode: log.to_state || log.from_state,
            createdBy: log.user?.name || log.entry_by || 'User',
            createdAt: log.entry_ts,
          });
          targetSet.push({ targetType, targetCode });
        }
      }
    }

    // Single Batch Query across all target types (0 N+1)
    const fulfillmentMap = await workflowTargetResolverRegistry.resolveTargetFulfillmentBatch(
      entityType,
      entityId,
      targetSet
    );

    const allResolvedRecommendations = rawRecs.map((r, index) => {
      const key = `${r.targetType}:${r.targetCode}`;
      const fulfillment = fulfillmentMap.get(key) || { isFulfilled: false, label: r.targetCode };

      return {
        id: r.recommendationId || `rec-${r.sourceLogId}-${index}`,
        sourceLogId: r.sourceLogId,
        sourceStateCode: r.sourceStateCode,
        targetType: r.targetType,
        targetCode: r.targetCode,
        label: fulfillment.label || r.targetCode,
        mode: (r.mode as 'RECOMMENDED' | 'REQUIRED') || 'RECOMMENDED',
        reason: r.reason || '',
        status: (fulfillment.isFulfilled ? 'FULFILLED' : 'PENDING') as 'PENDING' | 'FULFILLED' | 'CANCELLED',
        requiredBeforeTransitionId: r.requiredBeforeTransitionId,
        createdBy: r.createdBy,
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : undefined,
      };
    });

    // 7. Assemble Assignment Nodes Tree
    const currentStepOrder = dbStates.find((s) => s.state_code === currentStateCode)?.step_order
      ? Number(dbStates.find((s) => s.state_code === currentStateCode)?.step_order)
      : 1;

    const assignments: WorkflowAssignmentNode[] = dbStates.map((stateRow) => {
      const stepOrder = Number(stateRow.step_order);
      const isCurrent = stateRow.state_code === currentStateCode;
      const isPast = stepOrder < currentStepOrder;
      const status: 'COMPLETED' | 'CURRENT' | 'WAITING' = isCurrent
        ? 'CURRENT'
        : isPast
        ? 'COMPLETED'
        : 'WAITING';

      const matchingLogs = historyLogs.filter((h: any) => h.to_state === stateRow.state_code);

      const actions: WorkflowActionItem[] = matchingLogs.map((log: any) => ({
        id: log.wah_id,
        label: log.action ? log.action.replace(/_/g, ' ') : 'State Transition',
        actionCode: log.action,
        status: 'COMPLETED',
        completedAt: log.entry_ts ? new Date(log.entry_ts).toISOString() : undefined,
        completedBy: log.user ? log.user.name : log.entry_by || 'System',
        justification: log.comments || undefined,
      }));

      const nodeRecommendations = isCurrent
        ? allResolvedRecommendations
        : isPast
        ? allResolvedRecommendations.filter((r) =>
            matchingLogs.some((l: any) => l.wah_id === r.sourceLogId || l.to_state === stateRow.state_code)
          )
        : [];

      return {
        id: `assignment-${stateRow.state_code}`,
        stageName: stateRow.label || stateRow.state_code,
        assignedRole: 'Office / Reviewer',
        status,
        actions,
        pendingActions: isCurrent ? pendingActions : [],
        recommendations: nodeRecommendations,
      };
    });

    const currentStateMeta = dbStates.find((s) => s.state_code === currentStateCode);

    return {
      context: {
        moduleCode,
        entityType,
        entityId,
      },
      currentState: {
        stateCode: currentStateCode,
        label: currentStateMeta?.label || currentStateCode,
        color: currentStateMeta?.color || 'bg-[hsl(var(--badge-blue-bg))]',
        stepOrder: currentStepOrder,
        isTerminal: currentStateMeta?.is_terminal || false,
      },
      currentAssignment: {
        assignedRole: availableTransitions.length > 0 ? userContext.role : 'Reviewer',
        isCurrentUserAssigned: availableTransitions.length > 0,
        pendingActions,
        recommendations: allResolvedRecommendations,
      },
      assignments,
      availableTransitions,
      currentUserCapabilities: {
        canPerformTransition: availableTransitions.length > 0,
        canSignPendingDocument: pendingActions.some((a) => a.isAuthorizedForCurrentUser),
        canRecordMilestone: true,
        activeRole: userContext.role,
      },
      updatedAt: new Date().toISOString(),
    };
  }
}

export const workflowSnapshotQueryService = new WorkflowSnapshotQueryService();
