/**
 * StepTrackingService — manages micro-step completion & sub-task tracking.
 *
 * Part of the COALRR Universal Workflow Engine.
 * Decouples fine-grained multi-signature form loops and verification steps
 * from the macro finite state machine (workflow_states).
 *
 * Import from API routes and Use Cases ONLY — never from Client Components.
 */
import 'server-only'
import { db } from '@/lib/db'
import { Result, Ok, Fail } from '@/core'
import {
  normalizeCheckableEntityType,
  normalizeModuleCode,
  MODULE_CODES,
  CHECKABLE_ENTITY_TYPES,
} from '@/core/config/module-codes.config'
import { STEP_GROUPS_CONFIG, getStepGroupConfig } from '@/core/config/step-groups.config'

export interface StepTrackingRecord {
  id: string
  instance_id: string
  entity_type: string
  entity_id: string
  step_group: string
  step_key: string
  status: 'PENDING' | 'COMPLETED' | 'SKIPPED'
  remarks: string | null
  completed_by: number | null
  completed_at: Date | null
  entry_ts: Date
  updt_ts: Date
}

export interface CompleteStepDTO {
  entityType: string
  entityId: string
  stepGroup: string
  stepKey: string
  userId: number
  remarks?: string
}

export interface StepGroupStatusResult {
  stepGroup: string
  isComplete: boolean
  totalSteps: number
  completedSteps: number
  pendingSteps: number
  steps: StepTrackingRecord[]
}

export class StepTrackingService {
  /**
   * Initializes runtime step tracking records in DB for a newly registered or transitioned entity.
   */
  async initializeSteps(
    processCode: string,
    entityType: string,
    entityId: string,
    instanceId: string
  ): Promise<Result<StepTrackingRecord[]>> {
    try {
      const canonicalType = normalizeCheckableEntityType(entityType)
      const canonicalModule = normalizeModuleCode(processCode)
      const moduleGroupConfigs = STEP_GROUPS_CONFIG[canonicalModule] ?? {}

      const createdRecords: StepTrackingRecord[] = []

      for (const groupConfig of Object.values(moduleGroupConfigs)) {
        for (const stepDef of groupConfig.steps) {
          // Check if record already exists or upsert
          const record = await (db as any).process_step_tracking.upsert({
            where: {
              uq_process_step_tracking: {
                entity_type: canonicalType,
                entity_id: entityId,
                step_group: groupConfig.groupCode,
                step_key: stepDef.stepKey,
              },
            },
            create: {
              instance_id: instanceId,
              entity_type: canonicalType,
              entity_id: entityId,
              step_group: groupConfig.groupCode,
              step_key: stepDef.stepKey,
              status: 'PENDING',
            },
            update: {},
          })
          createdRecords.push(record)
        }
      }

      return Ok(createdRecords)
    } catch (e: any) {
      console.error('StepTrackingService.initializeSteps error:', e)
      return Fail(e.message ?? 'Failed to initialize step tracking records')
    }
  }

  /**
   * Marks an individual micro-step completed by a specific user.
   * If all steps in the group are satisfied, evaluates group completion status.
   */
  async completeStep(dto: CompleteStepDTO): Promise<Result<{ isGroupComplete: boolean; record: StepTrackingRecord }>> {
    try {
      const canonicalType = normalizeCheckableEntityType(dto.entityType)

      // 1. Update the target step tracking record
      const updated = await (db as any).process_step_tracking.update({
        where: {
          uq_process_step_tracking: {
            entity_type: canonicalType,
            entity_id: dto.entityId,
            step_group: dto.stepGroup,
            step_key: dto.stepKey,
          },
        },
        data: {
          status: 'COMPLETED',
          completed_by: dto.userId,
          completed_at: new Date(),
          remarks: dto.remarks ?? null,
          updt_ts: new Date(),
        },
      })

      // 2. Count remaining pending steps in this group
      const pendingCount = await (db as any).process_step_tracking.count({
        where: {
          entity_type: canonicalType,
          entity_id: dto.entityId,
          step_group: dto.stepGroup,
          status: 'PENDING',
        },
      })

      const isGroupComplete = pendingCount === 0

      // 3. Log audit event if group is 100% complete
      if (isGroupComplete) {
        await (db as any).outbox_events.create({
          data: {
            event_name: 'STEP_GROUP_COMPLETED',
            module: canonicalType,
            payload: {
              entityType: canonicalType,
              entityId: dto.entityId,
              stepGroup: dto.stepGroup,
              completedByUserId: dto.userId,
              timestamp: new Date().toISOString(),
            },
            status: 'PENDING',
          },
        })
      }

      return Ok({ isGroupComplete, record: updated })
    } catch (e: any) {
      console.error('StepTrackingService.completeStep error:', e)
      return Fail(e.message ?? 'Failed to complete step')
    }
  }

  /**
   * Retrieves step completion status array for an entity and optional step group.
   */
  async getStepStatus(
    entityType: string,
    entityId: string,
    stepGroup?: string
  ): Promise<Result<StepGroupStatusResult>> {
    try {
      const canonicalType = normalizeCheckableEntityType(entityType)
      const whereCondition: any = {
        entity_type: canonicalType,
        entity_id: entityId,
      }
      if (stepGroup) {
        whereCondition.step_group = stepGroup
      }

      const steps = await (db as any).process_step_tracking.findMany({
        where: whereCondition,
        orderBy: [{ step_group: 'asc' }, { entry_ts: 'asc' }],
      })

      const totalSteps = steps.length
      const completedSteps = steps.filter((s: any) => s.status === 'COMPLETED').length
      const pendingSteps = totalSteps - completedSteps
      const isComplete = totalSteps > 0 && pendingSteps === 0

      return Ok({
        stepGroup: stepGroup ?? 'ALL',
        isComplete,
        totalSteps,
        completedSteps,
        pendingSteps,
        steps,
      })
    } catch (e: any) {
      console.error('StepTrackingService.getStepStatus error:', e)
      return Fail(e.message ?? 'Failed to fetch step tracking status')
    }
  }

  /**
   * Fast evaluation check if a specific step group is 100% complete.
   */
  async isStepGroupComplete(
    entityType: string,
    entityId: string,
    stepGroup: string
  ): Promise<Result<boolean>> {
    try {
      const canonicalType = normalizeCheckableEntityType(entityType)
      const pendingCount = await (db as any).process_step_tracking.count({
        where: {
          entity_type: canonicalType,
          entity_id: entityId,
          step_group: stepGroup,
          status: 'PENDING',
        },
      })
      return Ok(pendingCount === 0)
    } catch (e: any) {
      console.error('StepTrackingService.isStepGroupComplete error:', e)
      return Fail(e.message ?? 'Failed to evaluate step group completeness')
    }
  }
}

export const stepTrackingService = new StepTrackingService()
