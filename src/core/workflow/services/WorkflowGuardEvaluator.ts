import 'server-only';
import { db } from '@/lib/db';
import { Container } from '@/infrastructure/di/Container';
import { MODULE_CODES, CHECKABLE_ENTITY_TYPES } from '@/core/config/module-codes.config';
import type { GuardContext, GuardResult, Transition } from '../types';

export interface WorkflowGuardEvaluatorRequest {
  moduleCode: string;
  entityType: string;
  entityId: string;
  currentState: string;
  userContext: { userId?: string; role: string };
  transition: Transition & { workflowCode?: string };
}

export class WorkflowGuardEvaluator {
  /**
   * Evaluates all prerequisites & transition guards for a candidate workflow transition.
   * Enforces Plot Schedule, Mandatory Checklist, Required Generated Documents & Signatures,
   * and DB Transition Guards.
   */
  async evaluateTransition(req: WorkflowGuardEvaluatorRequest): Promise<GuardResult> {
    const { moduleCode, entityType, entityId, currentState, userContext, transition } = req;

    // 1. Role Authorization Check
    const userRole = userContext.role || 'unit_office';
    const isSuperAdmin = userRole.toLowerCase().includes('admin');
    if (!isSuperAdmin && transition.role && transition.role !== 'all' && transition.role !== userRole) {
      return {
        ok: false,
        reason: `Role '${userRole}' is not authorized to execute transition '${transition.name}' (Required: '${transition.role}')`,
      };
    }

    // 2. Drafting Prerequisites Check (Applies to all transitions moving out of Drafting)
    if (currentState === 'Drafting') {
      // A. Plot Schedule Completeness (at least 1 plot required)
      if (entityType === CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE || moduleCode === MODULE_CODES.LAND_SCHEDULE) {
        const plotCount = await db.plot_schedule.count({
          where: { proposal_id: entityId },
        });
        if (plotCount === 0) {
          return {
            ok: false,
            reason: 'At least 1 plot schedule entry is required before proposal submission',
          };
        }
      }

      // B. Mandatory Checklist Completeness
      if (Container.getChecklistStatusUseCase) {
        const checklistRes = await Container.getChecklistStatusUseCase.execute({
          moduleCode,
          checkableType: entityType,
          checkableId: entityId,
        });

        if (checklistRes.isSuccess && checklistRes.value) {
          const items = checklistRes.value.items || [];
          const mandatoryItems = items.filter((i: any) => i.isMandatory);
          const unsatisfied = mandatoryItems.filter((i: any) => {
            const status = i.submission?.status;
            return !(
              status === 'SUBMITTED' ||
              status === 'APPROVED' ||
              status === 'AUTO_SATISFIED' ||
              i.generatedDocInfo?.status === 'COMPLETED'
            );
          });

          if (unsatisfied.length > 0) {
            return {
              ok: false,
              reason: `Mandatory checklist items incomplete for Drafting stage: ${unsatisfied
                .map((i: any) => i.title || i.chkCode)
                .join(', ')}`,
            };
          }

          // C. Required Generated Documents & Signatures Check for Drafting stage (e.g. Form-VII)
          const generatedDocRules = items.filter(
            (i: any) =>
              i.inputSchema?.type === 'generated_document' ||
              i.type === 'generated_document' ||
              i.inputSchema?.template_code ||
              i.inputSchema?.templateCode
          );

          if (generatedDocRules.length > 0) {
            const docInstances = await db.document_instance.findMany({
              where: { application_id: entityId },
              select: { id: true, template_code: true, signature_data_json: true },
            });

            for (const docRule of generatedDocRules) {
              const tmplCode =
                docRule.inputSchema?.template_code ||
                docRule.inputSchema?.templateCode ||
                docRule.chkCode;
              const docInst = docInstances.find((d) => d.template_code === tmplCode);

              if (!docInst) {
                return {
                  ok: false,
                  reason: `Required document '${
                    docRule.title || tmplCode
                  }' must be generated before proposal submission`,
                };
              }

              // Check document signature rules
              const sigRules = await db.document_template_signature.findMany({
                where: { template_code: tmplCode },
                select: { sig_permission: true },
              });

              if (sigRules.length > 0) {
                const sigDataJson = (docInst.signature_data_json as any[]) || [];
                const signedRoles = new Set(
                  sigDataJson.map((s) => s.role || s.sig_permission)
                );
                const pendingSig = sigRules.find((r) => !signedRoles.has(r.sig_permission));

                if (pendingSig) {
                  return {
                    ok: false,
                    reason: `Required document '${
                      docRule.title || tmplCode
                    }' requires signature by role '${
                      pendingSig.sig_permission
                    }' before proposal submission`,
                  };
                }
              }
            }
          }
        }
      }
    }

    // 3. Stage-Specific Checklist & Document Completeness for Non-Drafting States
    if (currentState !== 'Drafting' && Container.getChecklistStatusUseCase) {
      const checklistRes = await Container.getChecklistStatusUseCase.execute({
        moduleCode,
        checkableType: entityType,
        checkableId: entityId,
      });

      if (checklistRes.isSuccess && checklistRes.value) {
        const items = checklistRes.value.items || [];
        const stageItems = items.filter((i: any) => i.stageCode === currentState);
        const mandatoryStageItems = stageItems.filter((i: any) => i.isMandatory);
        const unsatisfied = mandatoryStageItems.filter((i: any) => {
          const status = i.submission?.status;
          return !(
            status === 'SUBMITTED' ||
            status === 'APPROVED' ||
            status === 'AUTO_SATISFIED' ||
            i.generatedDocInfo?.status === 'COMPLETED'
          );
        });

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

    // 4. DB Transition Guard Check (if defined on transition)
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
