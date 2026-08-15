import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processRegistry } from '@/core/workflow/ProcessRegistry';
import { processInstanceService } from '@/core/workflow/services/ProcessInstanceService';
import { workflowTaskService } from '@/core/workflow/services/WorkflowTaskService';
import { workflowBranchService } from '@/core/workflow/services/WorkflowBranchService';
import { workflowReactionService } from '@/core/workflow/services/WorkflowReactionService';
import { timelineService } from '@/core/workflow/services/TimelineService';
import { documentVersionService } from '@/modules/document-engine/application/DocumentVersionService';
import { manualMilestoneService } from '@/core/workflow/services/ManualMilestoneService';
import { ChecklistContextFreshnessGuard } from '@/core/workflow/guards';

// Mock database calls for fast in-memory unit testing
vi.mock('@/lib/db', () => {
  const store = new Map<string, any>();
  return {
    db: {
      process_definition: {
        findUnique: vi.fn().mockResolvedValue({ id: 'def-101', process_code: 'LAND_ACQ_PROPOSAL', module_code: 'LAND_SCHEDULE' }),
      },
      process_instance: {
        findFirst: vi.fn().mockImplementation(({ where }) => {
          const key = `pi_${where.entity_type}_${where.entity_id}`;
          return Promise.resolve(store.get(key) ?? null);
        }),
        create: vi.fn().mockImplementation(({ data }) => {
          const instance = { id: 'pi-101', ...data };
          store.set(`pi_${data.entity_type}_${data.entity_id}`, instance);
          return Promise.resolve(instance);
        }),
        update: vi.fn().mockImplementation(({ where, data }) => {
          for (const [k, v] of store.entries()) {
            if (v.id === where.id) {
              const updated = { ...v, ...data };
              store.set(k, updated);
              return Promise.resolve(updated);
            }
          }
          return Promise.resolve({ id: where.id, ...data });
        }),
      },
      workflow_task: {
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'task-1', ...data })),
        update: vi.fn().mockImplementation(({ where, data }) => Promise.resolve({ id: where.id, ...data })),
        findMany: vi.fn().mockResolvedValue([]),
      },
      workflow_branch: {
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'branch-1', ...data })),
        update: vi.fn().mockImplementation(({ where, data }) => Promise.resolve({ id: where.id, status: 'COMPLETED' })),
        findMany: vi.fn().mockResolvedValue([]),
      },
      workflow_reaction: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'react-1',
            module_code: 'LAND_SCHEDULE',
            process_code: 'LAND_ACQ_PROPOSAL',
            trigger_event: 'milestone_recorded',
            condition_json: { milestone_code: 'SECTION_4_NOTIFICATION' },
            rule_type: 'TRIGGER',
            action_code: 'advance_to_sec7_prep',
            priority: 1,
            is_active: true,
          },
        ]),
      },
      manual_milestone: {
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'ms-1', ...data })),
        findMany: vi.fn().mockResolvedValue([]),
      },
      milestone_definition: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
      proposal_snapshot: {
        create: vi.fn().mockResolvedValue({ id: 'snap-1' }),
      },
      acq_proposal: {
        findUnique: vi.fn().mockResolvedValue({ proposal_id: 'PROP-001', proposal_no: 'ECL/PROP/2026/01' }),
      },
      workflow_transitions: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      timeline_event: {
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'te-1', ...data })),
        findMany: vi.fn().mockResolvedValue([
          { id: 'te-1', event_type: 'WORKFLOW_TRANSITION', event_category: 'WORKFLOW', from_state: 'Drafting', to_state: 'UnitSubmitted' }
        ]),
      },
      document_version: {
        findFirst: vi.fn().mockImplementation(({ where }) => {
          const versions = store.get(`doc_v_${where.document_instance_id}`) ?? [];
          return Promise.resolve(versions[versions.length - 1] ?? null);
        }),
        create: vi.fn().mockImplementation(({ data }) => {
          const key = `doc_v_${data.document_instance_id}`;
          const existing = store.get(key) ?? [];
          const v = { id: `v-${existing.length + 1}`, ...data };
          store.set(key, [...existing, v]);
          return Promise.resolve(v);
        }),
        update: vi.fn().mockImplementation(({ where, data }) => Promise.resolve({ id: where.id, ...data })),
      },
    },
  };
});

describe('Generic Process Platform — Full Land Acquisition Workflow Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Verifies module self-registration in ProcessRegistry', () => {
    processRegistry.register({
      moduleCode: 'LAND_SCHEDULE',
      processCode: 'LAND_ACQ_PROPOSAL',
      name: 'Land Acquisition Proposal Process',
      defaultWorkflowCode: 'COMPENSATION_PAYROLL',
    });

    expect(processRegistry.hasProcess('LAND_ACQ_PROPOSAL')).toBe(true);
    const proc = processRegistry.getProcess('LAND_ACQ_PROPOSAL');
    expect(proc?.moduleCode).toBe('LAND_SCHEDULE');
  });

  it('2. Initializes ProcessInstance and updates states', async () => {
    const res = await processInstanceService.getOrCreateInstance(
      'acq_land_schedule',
      'PROP-TEST-001',
      'LAND_ACQ_PROPOSAL',
      'Drafting'
    );

    expect(res.isSuccess).toBe(true);
    expect(res.value.entity_id).toBe('PROP-TEST-001');
    expect(res.value.current_state).toBe('Drafting');

    // Update state to UnitSubmitted
    const updateRes = await processInstanceService.updateState(res.value.id, 'UnitSubmitted');
    expect(updateRes.isSuccess).toBe(true);
  });

  it('3. Evaluates ChecklistContextFreshnessGuard', () => {
    const freshnessGuard = new ChecklistContextFreshnessGuard();

    // Fresh context
    const freshCheck = freshnessGuard.check({
      recordId: 'PROP-001',
      recordType: 'acq_land_schedule',
      actorRole: 'unit_office',
      currentState: 'Drafting',
      data: { isContextStale: false },
    });
    expect(freshCheck.ok).toBe(true);

    // Stale context
    const staleCheck = freshnessGuard.check({
      recordId: 'PROP-001',
      recordType: 'acq_land_schedule',
      actorRole: 'unit_office',
      currentState: 'Drafting',
      data: { isContextStale: true },
    });
    expect(staleCheck.ok).toBe(false);
    expect(staleCheck.reason).toContain('Checklist context is stale');
  });

  it('4. Creates and completes Workflow Tasks', async () => {
    const taskRes = await workflowTaskService.createTask({
      processInstanceId: 'pi-101',
      stateCode: 'AreaVetting',
      assignedRole: 'area_office',
      taskType: 'REVIEW',
    });

    expect(taskRes.isSuccess).toBe(true);
    expect(taskRes.value.assigned_role).toBe('area_office');

    const completeRes = await workflowTaskService.completeTask(taskRes.value.id, 101);
    expect(completeRes.isSuccess).toBe(true);
    expect(completeRes.value.status).toBe('COMPLETED');
  });

  it('5. Creates and completes parallel Workflow Branches', async () => {
    const b1 = await workflowBranchService.createBranch({
      processInstanceId: 'pi-101',
      branchKey: 'gm_planning_review',
      branchType: 'HQ_PARALLEL',
    });

    expect(b1.isSuccess).toBe(true);
    expect(b1.value.branch_key).toBe('gm_planning_review');

    const completeRes = await workflowBranchService.completeBranch(b1.value.id);
    expect(completeRes.isSuccess).toBe(true);
  });

  it('6. Records Milestone and triggers WorkflowReaction', async () => {
    const msRes = await manualMilestoneService.recordMilestone({
      entity_type: 'acq_land_schedule',
      entity_id: 'PROP-TEST-001',
      milestone_type: 'SECTION_4_NOTIFICATION',
      milestone_date: new Date(),
      outcome: 'PUBLISHED_GAZETTE',
      user_id: 'usr-1',
    });

    expect(msRes.isSuccess).toBe(true);

    // Query reaction rules
    const reactions = await workflowReactionService.findReactions('milestone_recorded', {
      milestone_code: 'SECTION_4_NOTIFICATION',
    });

    expect(reactions.length).toBeGreaterThan(0);
    expect(reactions[0].triggerEvent).toBe('milestone_recorded');
  });

  it('7. Projects events to Unified Timeline', async () => {
    const eventRes = await timelineService.recordEvent({
      processInstanceId: 'pi-101',
      eventType: 'WORKFLOW_TRANSITION',
      eventCategory: 'WORKFLOW',
      fromState: 'Drafting',
      toState: 'UnitSubmitted',
      actorRole: 'unit_office',
      message: 'Submitted proposal from Unit Office',
    });

    expect(eventRes.isSuccess).toBe(true);

    const timeline = await timelineService.getTimelineForProcess('pi-101');
    expect(timeline.isSuccess).toBe(true);
    expect(timeline.value).not.toBeNull();
    expect(timeline.value?.length).toBeGreaterThan(0);
  });

  it('8. Performs non-destructive Document Versioning', async () => {
    // Create Version 1
    const v1 = await documentVersionService.createNewVersion({
      documentInstanceId: 'doc-inst-777',
      generationReason: 'Initial Form-VII generation',
      createdBy: 'unit_officer_1',
    });

    expect(v1.isSuccess).toBe(true);
    expect(v1.value.version_no).toBe(1);

    // Create Version 2 (Regeneration)
    const v2 = await documentVersionService.createNewVersion({
      documentInstanceId: 'doc-inst-777',
      generationReason: 'Regenerated after plot area modification',
      createdBy: 'unit_officer_1',
    });

    expect(v2.isSuccess).toBe(true);
    expect(v2.value.version_no).toBe(2);

    const latest = await documentVersionService.getLatestVersion('doc-inst-777');
    expect(latest.isSuccess).toBe(true);
    expect(latest.value.version_no).toBe(2);
  });
});
