import { db } from '@/lib/db';
import { Result, Ok, Fail } from '@/core';
import { ProcessContext, WorkflowState } from '../types';

export class ProcessInstanceService {
  /**
   * Creates or resolves an active process instance for a polymorphic entity.
   */
  async getOrCreateInstance(
    entityType: string,
    entityId: string,
    processCode: string,
    initialState: WorkflowState = 'Drafting',
    createdBy: string = 'system',
    businessContext: Record<string, unknown> = {}
  ): Promise<Result<any>> {
    try {
      // 1. Check if an active process_instance already exists for this entity
      const existing = await (db as any).process_instance.findFirst({
        where: {
          entity_type: entityType,
          entity_id: entityId,
          status: 'ACTIVE',
        },
      });

      if (existing) {
        return Ok(existing);
      }

      // 2. Resolve process definition ID if available
      const definition = await (db as any).process_definition.findUnique({
        where: { process_code: processCode },
      });

      const processDefinitionId = definition?.id ?? '00000000-0000-0000-0000-000000000000';

      // 3. Create process_instance record
      const instance = await (db as any).process_instance.create({
        data: {
          process_definition_id: processDefinitionId,
          entity_type: entityType,
          entity_id: entityId,
          current_state: initialState,
          status: 'ACTIVE',
          business_context: businessContext,
          created_by: createdBy,
        },
      });

      return Ok(instance);
    } catch (e: any) {
      console.error('ProcessInstanceService.getOrCreateInstance error:', e);
      return Fail(e.message ?? 'Failed to get or create process instance');
    }
  }

  /**
   * Updates current state of a process instance.
   */
  async updateState(instanceId: string, newState: WorkflowState): Promise<Result<any>> {
    try {
      const updated = await (db as any).process_instance.update({
        where: { id: instanceId },
        data: {
          current_state: newState,
          updt_ts: new Date(),
        },
      });
      return Ok(updated);
    } catch (e: any) {
      console.error('ProcessInstanceService.updateState error:', e);
      return Fail(e.message ?? 'Failed to update process instance state');
    }
  }

  /**
   * Reads current process context for an entity.
   */
  async getInstanceContext(entityType: string, entityId: string): Promise<Result<ProcessContext | null>> {
    try {
      const instance = await (db as any).process_instance.findFirst({
        where: {
          entity_type: entityType,
          entity_id: entityId,
          status: 'ACTIVE',
        },
        include: {
          process_definition: true,
        },
      });

      if (!instance) {
        return Ok(null);
      }

      return Ok({
        processCode: instance.process_definition?.process_code ?? 'DEFAULT',
        moduleCode: instance.process_definition?.module_code ?? 'DEFAULT',
        entityType: instance.entity_type,
        entityId: instance.entity_id,
        currentState: instance.current_state,
        businessContext: (instance.business_context as Record<string, unknown>) ?? {},
      });
    } catch (e: any) {
      console.error('ProcessInstanceService.getInstanceContext error:', e);
      return Fail(e.message ?? 'Failed to read process instance context');
    }
  }
}

export const processInstanceService = new ProcessInstanceService();
