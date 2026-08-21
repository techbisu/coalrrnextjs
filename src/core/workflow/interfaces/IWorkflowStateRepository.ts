/**
 * IWorkflowStateRepository
 *
 * Domain interface for workflow_states data access.
 * Part of the core workflow module — used by GetChecklistStatusUseCase,
 * WorkflowSnapshotQueryService, and other services that need to
 * resolve workflow states without direct Prisma dependency.
 */

export interface WorkflowStateRow {
  state_code: string
  label: string
  color: string | null
  step_order: any // Decimal from Prisma — caller converts to Number()
  is_terminal: boolean
}

export interface IWorkflowStateRepository {
  /** Find all active workflow states for a workflow code, ordered by step_order */
  findActiveByWorkflowCode(workflowCode: string): Promise<WorkflowStateRow[]>
}
