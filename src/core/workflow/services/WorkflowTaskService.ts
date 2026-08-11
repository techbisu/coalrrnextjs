import { db } from '@/lib/db';
import { Result, Ok, Fail } from '@/core';

export interface CreateTaskDTO {
  processInstanceId: string;
  workflowCycleId?: string;
  workflowBranchId?: string;
  stateCode: string;
  taskType?: string;
  assignedUserId?: number;
  assignedRole?: string;
  assignmentScope?: Record<string, unknown>;
  dueAt?: Date;
}

export class WorkflowTaskService {
  async createTask(dto: CreateTaskDTO): Promise<Result<any>> {
    try {
      const task = await (db as any).workflow_task.create({
        data: {
          process_instance_id: dto.processInstanceId,
          workflow_cycle_id: dto.workflowCycleId,
          workflow_branch_id: dto.workflowBranchId,
          state_code: dto.stateCode,
          task_type: dto.taskType ?? 'REVIEW',
          assigned_user_id: dto.assignedUserId,
          assigned_role: dto.assignedRole,
          assignment_scope: dto.assignmentScope ?? {},
          due_at: dto.dueAt,
          status: 'PENDING',
        },
      });
      return Ok(task);
    } catch (e: any) {
      console.error('WorkflowTaskService.createTask error:', e);
      return Fail(e.message ?? 'Failed to create workflow task');
    }
  }

  async completeTask(taskId: string, userId: number): Promise<Result<any>> {
    try {
      const updated = await (db as any).workflow_task.update({
        where: { id: taskId },
        data: {
          status: 'COMPLETED',
          completed_at: new Date(),
          completed_by: userId,
        },
      });
      return Ok(updated);
    } catch (e: any) {
      console.error('WorkflowTaskService.completeTask error:', e);
      return Fail(e.message ?? 'Failed to complete workflow task');
    }
  }

  async getOpenTasksForUser(userId: number, roles: string[] = []): Promise<Result<any[]>> {
    try {
      const tasks = await (db as any).workflow_task.findMany({
        where: {
          status: 'PENDING',
          OR: [
            { assigned_user_id: userId },
            { assigned_role: { in: roles } },
          ],
        },
        orderBy: { entry_ts: 'desc' },
      });
      return Ok(tasks);
    } catch (e: any) {
      console.error('WorkflowTaskService.getOpenTasksForUser error:', e);
      return Fail(e.message ?? 'Failed to query open tasks');
    }
  }
}

export const workflowTaskService = new WorkflowTaskService();
