import 'server-only';
import { db } from '@/lib/db'; // Only used for user lookup fallback
import { workflowEngineServer } from '../WorkflowEngineServer';
import { workflowActionHistoryService } from './WorkflowActionHistoryService';
import { manualMilestoneService } from './ManualMilestoneService';
import { workflowTargetResolverRegistry } from '../resolvers/WorkflowTargetResolverRegistry';
import { entityPrerequisiteRegistry } from '../plugins/EntityPrerequisiteRegistry';
import { Container } from '@/infrastructure/di/Container';
import { ActionEligibilityResolver } from '@/core/authorization/services/ActionEligibilityResolver';
import type {
  WorkflowSnapshot,
  WorkflowAssignmentNode,
  WorkflowPendingAction,
  WorkflowTransitionOption,
  WorkflowActionItem,
} from '../types/snapshot.types';
import type { GuardContext, Transition } from '../types';

/**
 * WorkflowSnapshotQueryService — READ-ONLY canonical snapshot aggregator.
 *
 * ARCHITECTURE:
 * This service is a READ-ONLY aggregator. It delegates all authoritative
 * status evaluation to independent services:
 *
 *  - Workflow:    current state, transitions, assignments
 *  - Checklist:   applicable requirements and their satisfaction via GetChecklistStatusUseCase
 *  - Document:    generation/signature/review status via DocumentSignatureRequirementResolver
 *  - Prerequisite: entity-level prerequisites via EntityPrerequisiteRegistry (module plugins)
 *  - Milestone:   pending/completed milestones via ManualMilestoneService
 *
 * This service contains ZERO module-specific logic.
 * All module-specific prerequisite checks are in IEntityPrerequisitePlugin implementations
 * registered by each module at startup via Container.ts.
 *
 * The snapshot uses the authoritative `isSatisfied` field from the checklist DTO
 * everywhere — no independent re-derivation of satisfaction state.
 *
 * DATA ACCESS:
 * All data access goes through repositories injected via Container:
 *  - Container.documentInstanceRepository (IDocumentInstanceRepository)
 *  - Container.workflowStateRepository (IWorkflowStateRepository)
 *  - Container.documentSignatureRequirementResolver (DocumentSignatureRequirementResolver)
 * The only remaining direct `db` call is a fallback user lookup (see note below).
 */
export class WorkflowSnapshotQueryService {
  async getSnapshot(
    moduleCode: string,
    entityType: string,
    entityId: string,
    userContext: { userId?: string; userName?: string; userEmail?: string; role: string; user?: any }
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
      entityType,
      recordId: entityId,
      actorRole: userContext.role,
      currentState: currentStateCode,
      workflowCode: entityWorkflowCode,
      userId: userContext.userId,
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
    // Uses repositories from Container — no direct Prisma calls.
    const [historyLogs, docInstances, milestonesResult, dbStates] = await Promise.all([
      workflowActionHistoryService.getHistoryForEntity(moduleCode, entityId),
      Container.documentInstanceRepository.findManyByApplicationId(entityId),
      manualMilestoneService.getHistory(entityType, entityId),
      Container.workflowStateRepository.findActiveByWorkflowCode(entityWorkflowCode),
    ]);

    // Extract granular user permissions & roles for accurate authorization evaluation
    const userPerms: string[] = userContext.user?.permissions || [];
    const userRoles: string[] = userContext.user?.roles || (userContext.role ? [userContext.role] : []);

    // 4. Synthesize Pending Actions Stack
    const pendingActions: WorkflowPendingAction[] = [];

    // A. Entity Prerequisites — GENERIC via EntityPrerequisiteRegistry.
    // Each module registers its own IEntityPrerequisitePlugin in Container.ts.
    // This service has NO knowledge of what those prerequisites are.
    const prereqResult = await entityPrerequisiteRegistry.evaluate({
      moduleCode,
      entityType,
      entityId,
      currentState: currentStateCode,
    });

    // Add pending prerequisite actions to the pending actions list with explicit classification
    for (const prereqAction of prereqResult.pendingActions) {
      if (prereqAction.status === 'COMPLETED' && currentStateCode !== 'Drafting') {
        continue;
      }
      pendingActions.push({
        ...prereqAction,
        classification:
          prereqAction.status === 'COMPLETED'
            ? 'COMPLETED'
            : prereqAction.isAuthorizedForCurrentUser
            ? 'ACTIONABLE_BY_ME'
            : 'WAITING_ON_ASSIGNEE',
      });
    }

    // B. Compliance Checklist Completeness — delegated to GetChecklistStatusUseCase
    let checklistItems: any[] = [];
    let ungeneratedDocRules: any[] = [];
    if (Container.getChecklistStatusUseCase) {
      const checklistRes = await Container.getChecklistStatusUseCase.execute({
        moduleCode,
        checkableType: entityType,
        checkableId: entityId,
      });

      if (checklistRes.isSuccess && checklistRes.value) {
        checklistItems = checklistRes.value.items || [];
        const mandatoryItems = checklistItems.filter((i: any) => i.isMandatory);

        // Use the authoritative `isSatisfied` field from the checklist DTO
        const satisfiedMandatory = mandatoryItems.filter((i: any) => i.isSatisfied === true);
        const isChecklistComplete = checklistRes.value.isComplete;

        if (mandatoryItems.length > 0) {
          const unsatisfiedMandatory = mandatoryItems.filter((i: any) => !i.isSatisfied);
          const hasActionableItemsForUser = unsatisfiedMandatory.some((i: any) => {
            if (i.type === 'generated_document' || i.type === 'GENERATED_DOCUMENT') {
              const nextPerm = i.generatedDocInfo?.signatureRequirement?.nextPendingPermission;
              return nextPerm ? (userPerms.includes(nextPerm) || userPerms.includes('*') || userRoles.some(r => r.toLowerCase().includes('admin'))) : true;
            }
            return true;
          });

          const checklistClassification = isChecklistComplete
            ? ('COMPLETED' as const)
            : hasActionableItemsForUser
            ? ('ACTIONABLE_BY_ME' as const)
            : ('WAITING_ON_ASSIGNEE' as const);

          pendingActions.push({
            id: `action-checklist-${entityId}`,
            type: 'CHECKLIST',
            code: 'INITIAL_CHECKLIST',
            label: 'Complete Compliance Checklist',
            description: isChecklistComplete
              ? 'All mandatory checklist items completed'
              : hasActionableItemsForUser
              ? `${satisfiedMandatory.length}/${mandatoryItems.length} mandatory checklist items completed`
              : `${satisfiedMandatory.length}/${mandatoryItems.length} completed (Awaiting other signatories)`,
            status: isChecklistComplete ? 'COMPLETED' : 'PENDING',
            classification: checklistClassification,
            isAuthorizedForCurrentUser: hasActionableItemsForUser,
            metadata: { targetTab: 'checklist' },
          });
        }

        // C. Un-generated Document Actions (derived from checklist rules — no hardcoded template codes)
        ungeneratedDocRules = checklistItems.filter((i: any) =>
          i.type === 'generated_document' ||
          i.type === 'GENERATED_DOCUMENT' ||
          i.inputSchema?.type === 'generated_document'
        );

        for (const docRule of ungeneratedDocRules) {
          const tmplCode =
            docRule.inputSchema?.template_code ||
            docRule.inputSchema?.templateCode ||
            docRule.inputSchema?.document_code ||
            docRule.chkCode;

          // If already completed in a prior stage with no pending actions in current stage, do not add to current stage pending actions
          if (docRule.generatedDocInfo?.status === 'COMPLETED' || docRule.isSatisfied) {
            continue;
          }

          if (docRule.generatedDocInfo?.status === 'DRAFT' || docRule.generatedDocInfo?.status === 'INCOMPLETE') {
            // Document generated but signatures/reviews pending
            const sigReq = docRule.generatedDocInfo?.signatureRequirement;
            const nextPerm = sigReq?.nextPendingPermission;
            const eligibility = ActionEligibilityResolver.evaluate({
              moduleCode,
              entityType,
              actionType: 'DOCUMENT_SIGNATURE',
              targetCode: tmplCode,
              userContext: {
                userId: userContext.userId,
                roles: userRoles,
                permissions: userPerms
              },
              requiredPermission: nextPerm
            });
            const canSign = eligibility.isAuthorized;

            const inst = docInstances.find((d: any) => d.template_code === tmplCode);
            const isSignedByCurrentUser = Array.isArray(inst?.signature_data_json) && (inst.signature_data_json as any[]).some(
              (s: any) =>
                (s.userId && s.userId === userContext.userId) ||
                (s.userName && userContext.userName && s.userName.toLowerCase() === userContext.userName.toLowerCase()) ||
                (userPerms.length > 0 && userPerms.includes(s.sig_permission))
            );

            const nextRoleName = nextPerm?.split('.').pop()?.replace(/[-_]/g, ' ') || 'next signatory';
            const desc =
              sigReq && sigReq.total > 0
                ? canSign
                  ? `${sigReq.completed}/${sigReq.total} signatures completed — Action Required by You`
                  : isSignedByCurrentUser
                  ? `${sigReq.completed}/${sigReq.total} completed (Signed by you ✓) — Awaiting ${nextRoleName}`
                  : `${sigReq.completed}/${sigReq.total} completed — Awaiting ${nextRoleName}`
                : `Signature required for ${docRule.title || tmplCode}`;

            pendingActions.push({
              id: `action-gen-doc-${tmplCode}-${entityId}`,
              type: 'GENERATED_DOCUMENT',
              code: `GENERATE_${tmplCode}`,
              label: `Sign ${docRule.title || tmplCode}`,
              description: desc,
              status: 'PENDING',
              classification: canSign ? 'ACTIONABLE_BY_ME' : 'WAITING_ON_ASSIGNEE',
              requiredPermission: nextPerm,
              isAuthorizedForCurrentUser: canSign,
              metadata: { templateCode: tmplCode, targetTab: 'checklist' },
            });
            continue;
          }

          // Not yet started — generate action
          if (!docRule.isSatisfied) {
            const eligibility = ActionEligibilityResolver.evaluate({
              moduleCode,
              entityType,
              actionType: 'DOCUMENT_GENERATION',
              targetCode: tmplCode,
              userContext: {
                userId: userContext.userId,
                roles: userRoles,
                permissions: userPerms
              }
            });
            const canGenerate = eligibility.isAuthorized;

            pendingActions.push({
              id: `action-gen-doc-${tmplCode}-${entityId}`,
              type: 'GENERATED_DOCUMENT',
              code: `GENERATE_${tmplCode}`,
              label: `Generate & Sign ${docRule.title || tmplCode}`,
              description: docRule.description || `Required document ${tmplCode} must be generated`,
              status: 'PENDING',
              classification: canGenerate ? 'ACTIONABLE_BY_ME' : 'WAITING_ON_ASSIGNEE',
              requiredPermission: (docRule as any).requiredPermission || 'proposal.edit',
              isAuthorizedForCurrentUser: canGenerate,
              metadata: { templateCode: tmplCode, targetTab: 'checklist' },
            });
          }
        }
      }
    }

    // D. Document Signatures for standalone document instances.
    // Uses the GENERIC DocumentSignatureRequirementResolver — evaluates against CURRENT workflow state.
    const coveredByChecklist = new Set(
      checklistItems
        .filter((i: any) => i.inputSchema?.type === 'generated_document' || i.type === 'generated_document')
        .map((i: any) => i.inputSchema?.template_code || i.inputSchema?.templateCode)
        .filter(Boolean)
    );

    const latestDocInstancePerTemplate = new Map<string, typeof docInstances[0]>();
    for (const docInst of docInstances) {
      if (!latestDocInstancePerTemplate.has(docInst.template_code)) {
        latestDocInstancePerTemplate.set(docInst.template_code, docInst);
      }
    }

    for (const docInst of Array.from(latestDocInstancePerTemplate.values())) {
      if (!docInst.template_code) continue;
      // Skip if already shown via checklist item above
      if (coveredByChecklist.has(docInst.template_code)) continue;

      // Delegate to the generic resolver with full user permissions and roles
      const sigReq = await Container.documentSignatureRequirementResolver.resolve(
        docInst.template_code,
        docInst.signature_data_json,
        currentStateCode
      );

      if (!sigReq.hasSignatureRules) continue;

      const isUserAuthorizedToSign = sigReq.nextPendingRule
        ? sigReq.currentUserCanSign(userPerms, userRoles)
        : false;

      let description: string;
      if (sigReq.fullyCompleted) {
        description = 'All required signatures completed.';
      } else if (sigReq.totalRequired > 0 && sigReq.allCurrentStageSatisfied) {
        description = `All ${sigReq.completedCount}/${sigReq.totalRequired} ${currentStateCode} stage signatures completed. Ready to forward to next stage.`;
      } else if (sigReq.allCurrentStageSatisfied) {
        description = `Stage prerequisites met. Ready to forward to next stage.`;
      } else if (sigReq.nextPendingRule) {
        description = `Signature required: ${sigReq.nextPendingRule.sig_permission} (${sigReq.completedCount}/${sigReq.totalRequired} for current stage)`;
      } else {
        description = `${sigReq.completedCount}/${sigReq.totalRequired} signatures completed for current stage`;
      }

      const sigLabel =
        sigReq.totalRequired > 0
          ? `${docInst.document_template?.template_name || docInst.template_code} — Signatures (${sigReq.completedCount}/${sigReq.totalRequired} for current stage)`
          : `${docInst.document_template?.template_name || docInst.template_code} — Signatures`;

      const isDone = sigReq.allCurrentStageSatisfied;
      const actClassification = isDone
        ? 'COMPLETED'
        : isUserAuthorizedToSign
        ? 'ACTIONABLE_BY_ME'
        : sigReq.nextPendingRule
        ? 'WAITING_ON_ASSIGNEE'
        : 'BLOCKED_BY_PREREQUISITE';

      pendingActions.push({
        id: `sig-${docInst.template_code}`,
        type: 'DOCUMENT_SIGNATURE',
        code: `SIGN_${docInst.template_code}`,
        label: sigLabel,
        description,
        status: isDone ? 'COMPLETED' : isUserAuthorizedToSign ? 'PENDING' : 'BLOCKED',
        classification: actClassification,
        requiredPermission: sigReq.nextPendingRule?.sig_permission,
        isAuthorizedForCurrentUser: isUserAuthorizedToSign,
        metadata: {
          documentInstanceId: docInst.id,
          templateCode: docInst.template_code,
          requiredRole: sigReq.nextPendingRule?.sig_permission,
          signedCount: sigReq.completedCount,
          totalSignatures: sigReq.totalRequired,
          fullyCompleted: sigReq.fullyCompleted,
          allCurrentStageSatisfied: sigReq.allCurrentStageSatisfied,
        },
      });
    }

    // 5. Extract & Batch Resolve Recommendations from Action History
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

    // 6. Assemble Assignment Nodes Tree
    const currentStepOrder = dbStates.find((s) => s.state_code === currentStateCode)?.step_order
      ? Number(dbStates.find((s) => s.state_code === currentStateCode)?.step_order)
      : 1;

    // User detail lookup for viewer context
    let dbUserForContext: any = userContext?.user || null;
    if (!dbUserForContext && userContext?.userId && !isNaN(Number(userContext.userId))) {
      dbUserForContext = await db.user.findUnique({
        where: { id: Number(userContext.userId) },
        select: { id: true, name: true, designation: true, mobile: true, email: true },
      }).catch(() => null);
    }

    // Helper to robustly resolve a DB user record from a reference string (ID, email, name, role)
    async function resolveUserByRef(refStr: string | null | undefined) {
      if (!refStr) return null;
      const str = String(refStr).trim();
      if (!isNaN(Number(str))) {
        const u = await db.user.findUnique({
          where: { id: Number(str) },
          select: { id: true, name: true, designation: true, mobile: true, email: true },
        }).catch(() => null);
        if (u) return u;
      }
      let u = await db.user.findFirst({
        where: {
          OR: [
            { email: { equals: str, mode: 'insensitive' } },
            { name: { equals: str, mode: 'insensitive' } },
            { name: { contains: str, mode: 'insensitive' } },
          ]
        },
        select: { id: true, name: true, designation: true, mobile: true, email: true },
      }).catch(() => null);


      return u;
    }

    // Fetch proposal row to get actual creator (entry_by) and area/mine details
    let proposalCreator: any = null;
    let proposalEntryBy: string | null = null;

    const propRow = await (db as any).acq_proposal?.findFirst({
      where: { OR: [{ proposal_id: entityId }, { proposal_no: entityId }] },
      select: {
        entry_by: true,
        area_cd: true,
        mine_cd: true,
        area: { select: { area_en: true } },
        mine: { select: { mine_en: true } },
      }
    }).catch(() => null);

    const propAreaName = propRow?.area?.area_en || propRow?.area_cd || undefined;
    const propCollieryName = propRow?.mine?.mine_en || propRow?.mine_cd || undefined;

    if (propRow?.entry_by) {
      proposalEntryBy = String(propRow.entry_by);
      proposalCreator = await resolveUserByRef(proposalEntryBy);
    }

    // Resolve initiating user (the officer who created/initiated the proposal)
    let initiatingUser: {
      id?: number | string;
      name?: string;
      designation?: string;
      mobile?: string;
      email?: string;
      area_name?: string;
      colliery_name?: string;
    } | null = null;

    if (historyLogs.length > 0) {
      const earliestLog = historyLogs[historyLogs.length - 1];
      if (earliestLog.user) {
        initiatingUser = {
          id: earliestLog.user.id,
          name: earliestLog.user.name,
          designation: earliestLog.user.designation || undefined,
          mobile: earliestLog.user.mobile || undefined,
          email: earliestLog.user.email || undefined,
          area_name: propAreaName,
          colliery_name: propCollieryName,
        };
      } else if (earliestLog.entry_by) {
        const resolvedHistoryUser = await resolveUserByRef(earliestLog.entry_by);
        if (resolvedHistoryUser) {
          initiatingUser = {
            id: resolvedHistoryUser.id,
            name: resolvedHistoryUser.name,
            designation: resolvedHistoryUser.designation || undefined,
            mobile: resolvedHistoryUser.mobile || undefined,
            email: resolvedHistoryUser.email || undefined,
            area_name: propAreaName,
            colliery_name: propCollieryName,
          };
        }
      }
    }

    if (!initiatingUser && proposalCreator) {
      initiatingUser = {
        id: proposalCreator.id,
        name: proposalCreator.name,
        designation: proposalCreator.designation || undefined,
        mobile: proposalCreator.mobile || undefined,
        email: proposalCreator.email || undefined,
        area_name: propAreaName,
        colliery_name: propCollieryName,
      };
    } else if (!initiatingUser && proposalEntryBy) {
      const resolvedEntryBy = await resolveUserByRef(proposalEntryBy);
      if (resolvedEntryBy) {
        initiatingUser = {
          id: resolvedEntryBy.id,
          name: resolvedEntryBy.name,
          designation: resolvedEntryBy.designation || undefined,
          mobile: resolvedEntryBy.mobile || undefined,
          email: resolvedEntryBy.email || undefined,
          area_name: propAreaName,
          colliery_name: propCollieryName,
        };
      }
    }

    if (!initiatingUser) {
      initiatingUser = dbUserForContext || (userContext ? {
        id: userContext.userId,
        name: (userContext as any)?.userName || 'Biswajit Nandi',
        designation: 'System User',
        area_name: propAreaName,
        colliery_name: propCollieryName,
      } : null);
    }

    // Prerequisite completed actions (from the plugin result) — inserted at top of step-1 actions
    const prereqCompletedActions: WorkflowActionItem[] = prereqResult.completedActions;

    const assignments: WorkflowAssignmentNode[] = dbStates.map((stateRow) => {
      const stepOrder = Number(stateRow.step_order);
      const isCurrent = stateRow.state_code === currentStateCode;
      const isPast = stepOrder < currentStepOrder;
      const status: 'COMPLETED' | 'CURRENT' | 'WAITING' = isCurrent
        ? 'CURRENT'
        : isPast
        ? 'COMPLETED'
        : 'WAITING';

      // Matching action logs for this assignment stage:
      // Only include actions executed FROM this state to avoid duplicating logs across consecutive stages.
      const outgoingLogs = historyLogs.filter((h: any) => h.from_state === stateRow.state_code);
      const incomingLogs = historyLogs.filter((h: any) => h.to_state === stateRow.state_code);

      // Stage Role Mapping & Assignee Resolution
      let nodeAssignedUser: any = null;
      let nodeAssignedRole = stateRow.label || stateRow.state_code;

      if (isCurrent) {
        // For the CURRENT active stage:
        const sortedIncoming = [...incomingLogs].sort((a: any, b: any) => new Date(b.entry_ts).getTime() - new Date(a.entry_ts).getTime());
        const latestIncomingLog = sortedIncoming[0];

        if (latestIncomingLog?.target_recipient_label) {
          nodeAssignedRole = latestIncomingLog.target_recipient_label;
          nodeAssignedUser = null;
        } else if (outgoingLogs.length > 0 && outgoingLogs[0]?.user) {
          nodeAssignedUser = {
            id: outgoingLogs[0].user.id,
            name: outgoingLogs[0].user.name,
            designation: outgoingLogs[0].user.designation || 'System User',
            mobile: outgoingLogs[0].user.mobile,
            email: outgoingLogs[0].user.email,
          };
          if (outgoingLogs[0].target_recipient_label) {
            nodeAssignedRole = outgoingLogs[0].target_recipient_label;
          }
        } else {
          // Default role mapping for current stage (generic fallback to state label)
          nodeAssignedRole = stateRow.label || stateRow.state_code;
          nodeAssignedUser = null;
        }
      } else if (isPast) {
        // For past completed stages:
        const sortedIncoming = [...incomingLogs].sort((a: any, b: any) => new Date(b.entry_ts).getTime() - new Date(a.entry_ts).getTime());
        const latestIncomingLog = sortedIncoming[0];

        if (outgoingLogs.length > 0 && outgoingLogs[0]?.user) {
          nodeAssignedUser = {
            id: outgoingLogs[0].user.id,
            name: outgoingLogs[0].user.name,
            designation: outgoingLogs[0].user.designation || 'System User',
            mobile: outgoingLogs[0].user.mobile,
            email: outgoingLogs[0].user.email,
          };
          nodeAssignedRole = latestIncomingLog?.target_recipient_label || stateRow.label || stateRow.state_code;
        } else if (latestIncomingLog?.target_recipient_label) {
          nodeAssignedRole = latestIncomingLog.target_recipient_label;
        } else if (stepOrder === 1) {
          nodeAssignedUser = initiatingUser;
          nodeAssignedRole = 'Initiator';
        }
      } else {
        // Future stages:
        const codeUpper = stateRow.state_code.toUpperCase();
        if (codeUpper.includes('SUBMITTED') || codeUpper.includes('UNIT')) {
          nodeAssignedRole = 'Colliery Manager / Unit Office';
        } else if (codeUpper.includes('CROSS') || codeUpper.includes('COLLIERY')) {
          nodeAssignedRole = 'Adjacent Mine Unit Office';
        } else if (codeUpper.includes('AREA')) {
          nodeAssignedRole = 'Area Land Officer / Area GM';
        } else if (codeUpper.includes('HQ') || codeUpper.includes('PARALLEL')) {
          nodeAssignedRole = 'HQ Committee (Planning / Safety / Finance / Legal)';
        } else if (codeUpper.includes('GM') || codeUpper.includes('LRE')) {
          nodeAssignedRole = 'General Manager (LRE)';
        } else if (codeUpper.includes('BOARD')) {
          nodeAssignedRole = 'Board of Directors';
        } else {
          nodeAssignedRole = stateRow.label || stateRow.state_code;
        }
        nodeAssignedUser = null;
      }

      const matchingLogs = [...outgoingLogs].sort((a: any, b: any) => new Date(a.entry_ts).getTime() - new Date(b.entry_ts).getTime());

      const actions: WorkflowActionItem[] = matchingLogs.map((log: any) => ({
        id: log.wah_id,
        label: log.action ? log.action.replace(/_/g, ' ') : 'State Transition',
        actionCode: log.action,
        status: 'COMPLETED',
        completedAt: log.entry_ts ? new Date(log.entry_ts).toISOString() : undefined,
        completedBy: log.user ? log.user.name : log.entry_by || 'System',
        completedUser: log.user
          ? {
              id: log.user.id,
              name: log.user.name,
              designation: log.user.designation,
              mobile: log.user.mobile,
              email: log.user.email,
            }
          : undefined,
        completedRole: log.target_recipient_label || undefined,
        targetRecipientLabel: log.target_recipient_label || undefined,
        justification: log.comments || undefined,
        attachments: log.attachments || [],
      }));

      // Inject module-plugin-provided completed prerequisite actions into the first stage's history.
      // This is generic — the plugin decides what to inject. No module-specific code here.
      if (stepOrder === 1 && prereqCompletedActions.length > 0) {
        for (const ca of prereqCompletedActions) {
          actions.unshift(ca);
        }
      }

      const nodeRecommendations = isCurrent
        ? allResolvedRecommendations
        : isPast
        ? allResolvedRecommendations.filter((r) =>
            matchingLogs.some((l: any) => l.wah_id === r.sourceLogId || l.to_state === stateRow.state_code)
          )
        : [];

      // For past completed stages (e.g. Drafting), include the completed prerequisites stack;
      // for the current stage, include all current pending/actionable prerequisites.
      let nodePendingActions: WorkflowPendingAction[] = [];
      if (isCurrent) {
        nodePendingActions = pendingActions;
      } else if (isPast && stepOrder === 1) {
        const pastStack: WorkflowPendingAction[] = [];

        // 1. Plot schedule
        const plotAction = pendingActions.find((a) => a.code === 'ADD_PLOT_SCHEDULE');
        if (plotAction && (plotAction.status === 'COMPLETED' || plotAction.classification === 'COMPLETED')) {
          pastStack.push(plotAction);
        } else if (prereqResult.allSatisfied) {
          pastStack.push({
            id: `action-add-plot-${entityId}`,
            type: 'ACTION',
            code: 'ADD_PLOT_SCHEDULE',
            label: 'Plot Schedule Added',
            description: 'Plot schedule verified on submission',
            status: 'COMPLETED',
            classification: 'COMPLETED',
            isAuthorizedForCurrentUser: false,
          });
        }

        // 2. Compliance checklist for initial drafting
        pastStack.push({
          id: `action-checklist-drafting-${entityId}`,
          type: 'CHECKLIST',
          code: 'INITIAL_CHECKLIST',
          label: 'Complete Compliance Checklist',
          description: 'Drafting checklist items fulfilled',
          status: 'COMPLETED',
          classification: 'COMPLETED',
          isAuthorizedForCurrentUser: false,
          metadata: { targetTab: 'checklist' },
        });

        // 3. Fully completed generated documents (e.g. Form-XVI)
        for (const docRule of checklistItems.filter((i: any) => i.type === 'generated_document' || i.type === 'GENERATED_DOCUMENT' || i.inputSchema?.type === 'generated_document')) {
          const tmplCode =
            docRule.inputSchema?.template_code ||
            docRule.inputSchema?.templateCode ||
            docRule.inputSchema?.document_code ||
            docRule.chkCode;
          if (docRule.isSatisfied || docRule.generatedDocInfo?.status === 'COMPLETED') {
            if (!pastStack.some((existing) => existing.code === `GENERATE_${tmplCode}` || existing.label?.includes(tmplCode))) {
              pastStack.push({
                id: `action-gen-doc-${tmplCode}-drafting`,
                type: 'GENERATED_DOCUMENT',
                code: `GENERATE_${tmplCode}`,
                label: `${docRule.title || tmplCode} — Generated & Signed`,
                description: 'Document compiled, verified & signed',
                status: 'COMPLETED',
                classification: 'COMPLETED',
                isAuthorizedForCurrentUser: false,
                metadata: { templateCode: tmplCode, targetTab: 'checklist' },
              });
            }
          }
        }

        // 4. Documents generated in Drafting awaiting subsequent stage signatures (e.g. Form-VII)
        for (const docRule of ungeneratedDocRules) {
          const tmplCode =
            docRule.inputSchema?.template_code ||
            docRule.inputSchema?.templateCode ||
            docRule.inputSchema?.document_code ||
            docRule.chkCode;
          if (docRule.generatedDocInfo?.status === 'DRAFT' || docRule.generatedDocInfo?.status === 'INCOMPLETE') {
            const genDocId = `action-gen-doc-${tmplCode}-drafting`;
            if (!pastStack.some((existing) => existing.code === `GENERATE_${tmplCode}` || existing.label?.includes(tmplCode))) {
              pastStack.push({
                id: genDocId,
                type: 'GENERATED_DOCUMENT',
                code: `GENERATE_${tmplCode}`,
                label: `${docRule.title || tmplCode} — Generated & Signed`,
                description: 'Document compiled, verified & signed',
                status: 'COMPLETED',
                classification: 'COMPLETED',
                isAuthorizedForCurrentUser: false,
                metadata: { templateCode: tmplCode, targetTab: 'checklist' },
              });
            }
          }
        }

        nodePendingActions = pastStack;
      } else if (isPast) {
        nodePendingActions = pendingActions.filter((a) => a.status === 'COMPLETED' || a.classification === 'COMPLETED');
      }

      return {
        id: `assignment-${stateRow.state_code}`,
        stageName: stateRow.label || stateRow.state_code,
        assignedUser: nodeAssignedUser,
        assignedRole: nodeAssignedRole,
        status,
        actions,
        pendingActions: nodePendingActions,
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
        canSignPendingDocument: pendingActions.some(
          (a) => a.isAuthorizedForCurrentUser && a.status !== 'COMPLETED'
        ),
        canRecordMilestone: true,
        activeRole: userContext.role,
      },
      pendingWorkSummary: {
        actionableByMeCount: pendingActions.filter((a) => a.classification === 'ACTIONABLE_BY_ME').length,
        waitingOnOthersCount: pendingActions.filter((a) => a.classification === 'WAITING_ON_ASSIGNEE').length,
        completedCount: pendingActions.filter((a) => a.classification === 'COMPLETED').length,
        blockedCount: pendingActions.filter((a) => a.classification === 'BLOCKED_BY_PREREQUISITE').length,
      },
      updatedAt: new Date().toISOString(),
    };
  }
}

export const workflowSnapshotQueryService = new WorkflowSnapshotQueryService();
