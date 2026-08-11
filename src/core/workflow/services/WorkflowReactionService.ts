import { db } from '@/lib/db';
import { Result, Ok, Fail } from '@/core';
import { IWorkflowReactionService, WorkflowReactionRule } from '../interfaces/IWorkflowReaction';
import { workflowEngineServer } from '../WorkflowEngineServer';

export class WorkflowReactionService implements IWorkflowReactionService {
  async findReactions(triggerEvent: string, context: Record<string, unknown> = {}): Promise<WorkflowReactionRule[]> {
    try {
      const dbRules = await (db as any).workflow_reaction.findMany({
        where: {
          trigger_event: triggerEvent,
          is_active: true,
        },
        orderBy: { priority: 'desc' },
      });

      return dbRules.map((r: any) => ({
        id: r.id,
        moduleCode: r.module_code,
        processCode: r.process_code,
        triggerEvent: r.trigger_event,
        conditionJson: r.condition_json as Record<string, unknown>,
        ruleType: r.rule_type,
        actionCode: r.action_code,
        workflowState: r.workflow_state,
        priority: r.priority,
        isActive: r.is_active,
      }));
    } catch (e) {
      console.error('WorkflowReactionService.findReactions error:', e);
      return [];
    }
  }

  async handleEvent(
    triggerEvent: string,
    eventPayload: { entityType: string; entityId: string; currentState?: string; data?: Record<string, unknown> }
  ): Promise<void> {
    try {
      const matchingRules = await this.findReactions(triggerEvent, eventPayload.data ?? {});
      if (matchingRules.length === 0) return;

      for (const rule of matchingRules) {
        if (rule.ruleType === 'TRIGGER' && rule.actionCode) {
          // Attempt automatic state transition via WorkflowEngineServer
          await workflowEngineServer.attemptTransitionAsync(
            {
              recordId: eventPayload.entityId,
              recordType: eventPayload.entityType,
              actorRole: 'system',
              currentState: eventPayload.currentState ?? 'Drafting',
              data: eventPayload.data,
            },
            rule.actionCode
          );
        }
      }
    } catch (e) {
      console.error('WorkflowReactionService.handleEvent error:', e);
    }
  }
}

export const workflowReactionService = new WorkflowReactionService();
