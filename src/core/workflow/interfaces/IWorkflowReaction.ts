export interface WorkflowReactionRule {
  id?: string;
  moduleCode: string;
  processCode: string;
  triggerEvent: string;
  conditionJson?: Record<string, unknown>;
  ruleType: 'TRIGGER' | 'GUARD' | string;
  actionCode: string;
  workflowState?: string;
  priority?: number;
  isActive?: boolean;
}

export interface IWorkflowReactionService {
  findReactions(triggerEvent: string, context: Record<string, unknown>): Promise<WorkflowReactionRule[]>;
  handleEvent(triggerEvent: string, eventPayload: { entityType: string; entityId: string; data?: Record<string, unknown> }): Promise<void>;
}
