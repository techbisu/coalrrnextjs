import 'server-only';
import { Container } from '@/infrastructure/di/Container';
import { entityPrerequisiteRegistry } from '@/core/workflow/plugins/EntityPrerequisiteRegistry';
import type { GuardContext, GuardResult, Transition } from '../types';
import { RoleHierarchyResolver } from '@/core/authorization/services/RoleHierarchyResolver';

export interface WorkflowGuardEvaluatorRequest {
  moduleCode: string;
  entityType: string;
  entityId: string;
  currentState: string;
  userContext: { userId?: string; role: string };
  transition: Transition & { workflowCode?: string };
}

/**
 * WorkflowGuardEvaluator — evaluates all prerequisites & transition guards.
 *
 * ARCHITECTURE:
 * This service contains ZERO module-specific or state-specific business logic.
 * All evaluation is delegated to:
 *
 *  1. Role authorization (generic — from transition.role configuration)
 *  2. EntityPrerequisiteRegistry — module plugins evaluated generically by moduleCode
 *  3. GetChecklistStatusUseCase — authoritative checklist/document/signature evaluation
 *  4. DB-defined transition guards (transition.guard)
 *
 * To add a new module-specific prerequisite:
 *   Implement IEntityPrerequisitePlugin and register it in Container.ts.
 *   DO NOT add any module-specific code here.
 */
export function isRoleAuthorizedForWorkflowRole(userRole: string, requiredRole: string): boolean {
  return RoleHierarchyResolver.matches(userRole, requiredRole);
}

export class WorkflowGuardEvaluator {
  async evaluateTransition(req: WorkflowGuardEvaluatorRequest): Promise<GuardResult> {
    const { moduleCode, entityType, entityId, currentState, userContext, transition } = req;

    // 1. Role Authorization Check (generic — driven by transition.role DB config)
    const userRole = userContext.role || 'unit_office';
    if (!isRoleAuthorizedForWorkflowRole(userRole, transition.role)) {
      return {
        ok: false,
        reason: `Role '${userRole}' is not authorized to execute transition '${transition.name}' (Required: '${transition.role}')`,
      };
    }

    // 2. Entity Prerequisite Check (GENERIC — delegated to registered module plugins)
    // Each module registers its own IEntityPrerequisitePlugin in Container.ts.
    // This evaluator has NO knowledge of what those prerequisites are.
    const prereqResult = await entityPrerequisiteRegistry.evaluateForGuard({
      moduleCode,
      entityType,
      entityId,
      currentState,
    });
    if (!prereqResult.ok) {
      return { ok: false, reason: prereqResult.reason };
    }

    // 3. Delegate ALL Checklist Evaluation to the Authoritative Checklist Service.
    // The checklist service evaluates:
    //  - Applicability (show_if rules — state-scoped, driven by DB config)
    //  - Manual input / upload requirements
    //  - Generated document requirements (via GeneratedDocumentChecklistAdapter)
    //  - State-scoped signature requirements (via DocumentSignatureRequirementResolver)
    //  - Milestone requirements
    // No duplicate evaluation here.
    if (Container.getChecklistStatusUseCase) {
      const checklistRes = await Container.getChecklistStatusUseCase.execute({
        moduleCode,
        checkableType: entityType,
        checkableId: entityId,
      });

      if (checklistRes.isSuccess && checklistRes.value) {
        const items = checklistRes.value.items || [];

        // Use the authoritative isSatisfied field from the checklist DTO.
        // This is the same field consumed by the snapshot service and UI — no divergence.
        const unsatisfied = items.filter((i: any) => i.isMandatory && !i.isSatisfied);

        if (unsatisfied.length > 0) {
          return {
            ok: false,
            reason: `Mandatory checklist items incomplete for stage '${currentState}': ${unsatisfied
              .map((i: any) => i.title || i.chkCode)
              .join(', ')}`,
          };
        }
      }
    }

    // 4. DB Transition Guard Check (if defined on transition row)
    if (transition.guard) {
      const guardCtx: GuardContext = {
        recordId: entityId,
        recordType: moduleCode,
        entityType,
        actorRole: userRole,
        currentState,
        workflowCode: transition.workflowCode,
      };
      const guardRes = transition.guard.check(guardCtx);
      if (!guardRes.ok) {
        return guardRes;
      }
    }

    return { ok: true };
  }
}

export const workflowGuardEvaluator = new WorkflowGuardEvaluator();
