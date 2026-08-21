import { NextRequest, NextResponse } from 'next/server';
import { authorizeModuleApi } from '@/core/authorization/middleware/authorize';
import { ok, badRequest, serverError } from '@/app/api/_lib';
import { workflowEngineServer } from '@/core/workflow/WorkflowEngineServer';
import { workflowActionHistoryService } from '@/core/workflow/services/WorkflowActionHistoryService';
import { workflowTargetResolverRegistry } from '@/core/workflow/resolvers/WorkflowTargetResolverRegistry';
import { normalizeModuleCode, MODULE_CODES, CHECKABLE_ENTITY_TYPES } from '@/core/config/module-codes.config';
import { acqProposalRepository } from '@/infrastructure/di/Container';
import { ProposalState } from '@/domain/entities/proposal';
import { EventBus } from '@/core/notifications/EventBus';
import { z } from 'zod';

const WorkflowTransitionSchema = z.object({
  moduleCode: z.string().min(1),
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  transition: z.string().min(1),
  role: z.string().optional(),
  comments: z.string().optional(),
  area_cd: z.string().optional(),
  mine_cd: z.string().optional(),
  unit_cd: z.string().optional(),
  target_user_id: z.string().optional(),
  target_role: z.string().optional(),
  target_mines: z.array(z.string()).optional(),
  recommendations: z.array(z.any()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = WorkflowTransitionSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(`Invalid transition parameters: ${parsed.error.issues.map((i) => i.message).join(', ')}`);
    }

    const {
      moduleCode,
      entityType,
      entityId,
      transition: transitionName,
      role: providedRole,
      comments,
      area_cd,
      mine_cd,
      unit_cd,
      target_user_id,
      recommendations,
    } = parsed.data;

    // 1. Mandatory Authorization Check (Generic Module-Scoped)
    const auth = await authorizeModuleApi(moduleCode, 'transition');
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: 403 });
    }

    const authUser = auth.user;
    const actorRole = providedRole || authUser.roles?.[0] || 'unit_office';

    // 2. Resolve current status for entity
    const targetStatus = await workflowTargetResolverRegistry.resolveStatus(
      moduleCode,
      entityType,
      entityId
    );

    const currentState = targetStatus?.currentStateCode || 'Drafting';
    const workflowCode = targetStatus?.workflowCode || moduleCode;

    const isIntraStageHandover =
      transitionName === 'handover_for_signature' ||
      transitionName === 'forward_for_signature' ||
      transitionName === 'notify_signatory' ||
      transitionName.startsWith('handover');

    let newStateStr = currentState;

    if (!isIntraStageHandover) {
      // 3. Attempt state machine transition
      const transitionResult = await workflowEngineServer.attemptTransitionAsync(
        {
          recordId: entityId,
          recordType: normalizeModuleCode(moduleCode),
          entityType,
          workflowCode,
          actorRole,
          currentState: currentState as any,
          userId: authUser.id,
        },
        transitionName,
        {
          area_cd,
          mine_cd,
          unit_cd,
          target_user_id,
        }
      );

      if (!transitionResult.ok) {
        return badRequest(transitionResult.reason || 'Workflow transition blocked by rules/guards');
      }

      newStateStr = transitionResult.newState!;

      // 4. Update domain entity if land acquisition module
      if (
        normalizeModuleCode(moduleCode) === MODULE_CODES.LAND_SCHEDULE ||
        entityType === CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE
      ) {
        const proposal = await acqProposalRepository.findById(entityId);
        if (proposal) {
          if (parsed.data.target_mines || area_cd) {
            proposal.update({
              adjacentCollieries: parsed.data.target_mines,
              areaOffice: area_cd,
            });
          }
          const newProposalState = ProposalState.fromString(newStateStr);
          proposal.transitionTo(newProposalState, String(authUser.id), comments);
          await acqProposalRepository.save(proposal);

          // Drain and publish Domain Events (CRITICAL FIX FOR STATE REACTIVITY)
          const domainEvents = proposal.clearDomainEvents();
          for (const event of domainEvents) {
            await EventBus.publish({
              event_name: event.event_type,
              module: 'land-acquisition',
              user_id: String(authUser.id),
              data: {
                ...event.toPayload(),
                proposal_id: proposal.id.value
              }
            });
          }
        }
      }
    }

    // 5. Record Audit Action in Workflow Action History
    const { target_role } = parsed.data;
    const recipientLabel = target_role || (mine_cd ? `Mine: ${mine_cd}` : area_cd ? `Area: ${area_cd}` : undefined);
    await workflowActionHistoryService.recordAction({
      moduleCode: normalizeModuleCode(moduleCode),
      entityType,
      entityId,
      action: transitionName,
      fromState: currentState,
      toState: newStateStr,
      userId: authUser.id ? Number(authUser.id) : undefined,
      userEmail: authUser.email || undefined,
      targetRecipientLabel: recipientLabel,
      comments: comments || undefined,
      recommendations: recommendations && recommendations.length > 0 ? recommendations : undefined,
    });

    return ok({
      success: true,
      fromState: currentState,
      toState: newStateStr,
      transition: transitionName,
      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[WorkflowTransitionAPI] Error executing transition:', err);
    return serverError('Failed to execute workflow transition', err.message);
  }
}
