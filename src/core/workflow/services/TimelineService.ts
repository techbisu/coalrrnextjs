import { db } from '@/lib/db';
import { Result, Ok, Fail } from '@/core';

export interface RecordTimelineEventDTO {
  processInstanceId: string;
  eventType: string;
  eventCategory: 'WORKFLOW' | 'TASK' | 'CHECKLIST' | 'MILESTONE' | 'DOCUMENT' | 'SIGNATURE' | string;
  actorUserId?: number;
  actorRole?: string;
  fromState?: string;
  toState?: string;
  taskId?: string;
  branchId?: string;
  cycleId?: string;
  documentId?: string;
  milestoneId?: string;
  targetUserId?: number;
  targetScope?: Record<string, unknown>;
  message?: string;
  metadataJson?: Record<string, unknown>;
}

export class TimelineService {
  /**
   * Records a unified timeline event into the process stream.
   */
  async recordEvent(dto: RecordTimelineEventDTO): Promise<Result<any>> {
    try {
      const event = await (db as any).timeline_event.create({
        data: {
          process_instance_id: dto.processInstanceId,
          event_type: dto.eventType,
          event_category: dto.eventCategory,
          actor_user_id: dto.actorUserId,
          actor_role: dto.actorRole,
          from_state: dto.fromState,
          to_state: dto.toState,
          task_id: dto.taskId,
          branch_id: dto.branchId,
          cycle_id: dto.cycleId,
          document_id: dto.documentId,
          milestone_id: dto.milestoneId,
          target_user_id: dto.targetUserId,
          target_scope: dto.targetScope ?? {},
          message: dto.message,
          metadata_json: dto.metadataJson ?? {},
        },
      });
      return Ok(event);
    } catch (e: any) {
      console.error('TimelineService.recordEvent error:', e);
      return Fail(e.message ?? 'Failed to record timeline event');
    }
  }

  /**
   * Reads unified timeline events for a process instance.
   */
  async getTimelineForProcess(processInstanceId: string): Promise<Result<any[]>> {
    try {
      const events = await (db as any).timeline_event.findMany({
        where: { process_instance_id: processInstanceId },
        orderBy: { created_at: 'desc' },
      });
      return Ok(events);
    } catch (e: any) {
      console.error('TimelineService.getTimelineForProcess error:', e);
      return Fail(e.message ?? 'Failed to query timeline events');
    }
  }
}

export const timelineService = new TimelineService();
