/**
 * Generic Core Workflow Platform — Snapshot Read Model Contracts.
 * 
 * Aggregates state, assignments, timeline, actions, and available transitions
 * into a single canonical snapshot for frontend rendering.
 */

export interface WorkflowContextReference {
  readonly moduleCode: string;   // e.g. MODULE_CODES.LAND_SCHEDULE ('LAND_SCHEDULE')
  readonly entityType: string;   // e.g. CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE ('acq_land_schedule')
  readonly entityId: string;     // e.g. "proposal-123"
}

export type WorkflowPendingActionType = 
  | 'WORKFLOW_REVIEW' 
  | 'DOCUMENT_SIGNATURE' 
  | 'CHECKLIST_ITEM' 
  | 'MILESTONE';

export interface WorkflowPendingAction {
  readonly id: string;
  readonly type: WorkflowPendingActionType;
  readonly code: string;
  readonly label: string;
  readonly description?: string;
  readonly status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  readonly isAuthorizedForCurrentUser: boolean;
  readonly metadata?: Record<string, unknown>;
}

export interface WorkflowActionItemAttachment {
  readonly id: string;
  readonly fileName: string;
  readonly mimeType?: string;
  readonly storagePath: string;
}

export interface WorkflowActionItem {
  readonly id: string;
  readonly label: string;
  readonly actionCode: string;
  readonly status: 'PENDING' | 'COMPLETED';
  readonly completedAt?: string;
  readonly completedBy?: string;
  readonly justification?: string;
  readonly attachments?: readonly WorkflowActionItemAttachment[];
  readonly documentRefId?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface WorkflowRecommendationItem {
  readonly id: string;
  readonly targetType: 'MILESTONE' | 'CHECKLIST' | 'DOCUMENT_SIGNATURE' | 'WORKFLOW_ACTION';
  readonly targetCode: string;
  readonly label: string;
  readonly mode: 'RECOMMENDED' | 'REQUIRED';
  readonly reason?: string;
  readonly status: 'PENDING' | 'FULFILLED' | 'CANCELLED';
  readonly requiredBeforeTransitionId?: string;
  readonly createdBy?: string;
  readonly createdAt?: string;
}

export interface WorkflowAssignmentNode {
  readonly id: string;
  readonly stageName: string;
  readonly assignedRole: string;
  readonly assignedUser?: {
    readonly id: string | number;
    readonly name: string;
  };
  readonly status: 'COMPLETED' | 'CURRENT' | 'WAITING';
  readonly completedAt?: string;
  readonly completedBy?: {
    readonly id: string | number;
    readonly name: string;
  };
  readonly actions: readonly WorkflowActionItem[];
  readonly pendingActions?: readonly WorkflowPendingAction[];
  readonly recommendations?: readonly WorkflowRecommendationItem[];
}

export interface WorkflowTransitionOption {
  readonly transitionId: string;
  readonly name: string;
  readonly label: string;
  readonly fromState: string;
  readonly toState: string;
  readonly requiredRole: string;
  readonly routingType?: 'FORCED' | 'CHOICE' | string;
  readonly targetOptionsSource?: string;
  readonly isAllowed: boolean;
  readonly disabledReason?: string;
}

export interface CurrentUserCapabilities {
  readonly canPerformTransition: boolean;
  readonly canSignPendingDocument: boolean;
  readonly canRecordMilestone: boolean;
  readonly activeRole?: string;
}

export interface WorkflowSnapshot {
  readonly context: WorkflowContextReference;
  readonly currentState: {
    readonly stateCode: string;
    readonly label: string;
    readonly color: string;
    readonly stepOrder: number;
    readonly isTerminal: boolean;
  };
  readonly currentAssignment: {
    readonly assignedRole: string;
    readonly assignedUser?: {
      readonly id: string | number;
      readonly name: string;
    };
    readonly isCurrentUserAssigned: boolean;
    readonly pendingActions: readonly WorkflowPendingAction[];
    readonly recommendations?: readonly WorkflowRecommendationItem[];
  };
  readonly assignments: readonly WorkflowAssignmentNode[];
  readonly availableTransitions: readonly WorkflowTransitionOption[];
  readonly currentUserCapabilities: CurrentUserCapabilities;
  readonly updatedAt: string;
}
