import { db } from '@/lib/db'
import type { IWorkflowStateRepository, WorkflowStateRow } from '@/core/workflow/interfaces/IWorkflowStateRepository'

export class PrismaWorkflowStateRepository implements IWorkflowStateRepository {
  async findActiveByWorkflowCode(workflowCode: string): Promise<WorkflowStateRow[]> {
    return db.workflow_states.findMany({
      where: { workflow_code: workflowCode, is_active: true },
      select: {
        state_code: true,
        label: true,
        color: true,
        step_order: true,
        is_terminal: true,
      },
      orderBy: { step_order: 'asc' },
    })
  }
}
