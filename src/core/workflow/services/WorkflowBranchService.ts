import { db } from '@/lib/db';
import { Result, Ok, Fail } from '@/core';

export interface CreateBranchDTO {
  processInstanceId: string;
  workflowCycleId?: string;
  branchKey: string;
  branchType: string;
  targetEntityType?: string;
  targetEntityId?: string;
  isRequired?: boolean;
  executionMode?: 'PARALLEL' | 'SEQUENTIAL';
}

export class WorkflowBranchService {
  async createBranch(dto: CreateBranchDTO): Promise<Result<any>> {
    try {
      const branch = await (db as any).workflow_branch.create({
        data: {
          process_instance_id: dto.processInstanceId,
          workflow_cycle_id: dto.workflowCycleId,
          branch_key: dto.branchKey,
          branch_type: dto.branchType,
          target_entity_type: dto.targetEntityType,
          target_entity_id: dto.targetEntityId,
          is_required: dto.isRequired ?? true,
          execution_mode: dto.executionMode ?? 'PARALLEL',
          status: 'ACTIVE',
        },
      });
      return Ok(branch);
    } catch (e: any) {
      console.error('WorkflowBranchService.createBranch error:', e);
      return Fail(e.message ?? 'Failed to create workflow branch');
    }
  }

  async completeBranch(branchId: string): Promise<Result<any>> {
    try {
      const updated = await (db as any).workflow_branch.update({
        where: { id: branchId },
        data: {
          status: 'COMPLETED',
          completed_at: new Date(),
        },
      });
      return Ok(updated);
    } catch (e: any) {
      console.error('WorkflowBranchService.completeBranch error:', e);
      return Fail(e.message ?? 'Failed to complete workflow branch');
    }
  }

  async areAllRequiredBranchesCompleted(processInstanceId: string, cycleId?: string): Promise<Result<boolean>> {
    try {
      const activePendingBranches = await (db as any).workflow_branch.findMany({
        where: {
          process_instance_id: processInstanceId,
          ...(cycleId ? { workflow_cycle_id: cycleId } : {}),
          is_required: true,
          status: { not: 'COMPLETED' },
        },
      });
      return Ok(activePendingBranches.length === 0);
    } catch (e: any) {
      console.error('WorkflowBranchService.areAllRequiredBranchesCompleted error:', e);
      return Fail(e.message ?? 'Failed to check branch completion');
    }
  }
}

export const workflowBranchService = new WorkflowBranchService();
