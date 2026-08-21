import { describe, it, expect, vi, beforeEach } from 'vitest';

// In-Memory entity state store for mock DB
const mockProposalDb = new Map<string, any>();

vi.mock('@/lib/db', () => ({
  db: {
    acq_proposal: {
      findUnique: vi.fn(async ({ where }) => mockProposalDb.get(where?.proposal_id) ?? null),
      findFirst: vi.fn(async () => {
        for (const p of mockProposalDb.values()) return p;
        return null;
      }),
      count: vi.fn(async () => 0),
    },
    checklist_requirement_rule: {
      findMany: vi.fn(async () => []),
    },
    checklist_submission: {
      findMany: vi.fn(async () => []),
    },
    checklist_entity_context: {
      findFirst: vi.fn(async () => null),
    },
    workflow_action_history: {
      findMany: vi.fn(async () => []),
      create: vi.fn(async ({ data }) => ({ id: 1, ...data })),
    },
    workflow_transitions: {
      findMany: vi.fn(async () => []),
    },
    manual_milestone: {
      findMany: vi.fn(async () => []),
    },
    workflow_states: {
      findMany: vi.fn(async () => []),
    },
    document_instance: {
      findMany: vi.fn(async () => []),
    },
    file_attachment: {
      findMany: vi.fn(async () => []),
    },
  },
}));

import { WorkflowSnapshotQueryService } from '@/core/workflow/services/WorkflowSnapshotQueryService';
import { DocumentSignatureRequirementResolver } from '@/core/document-requirement/DocumentSignatureRequirementResolver';
import { MODULE_CODES, CHECKABLE_ENTITY_TYPES } from '@/core/config/module-codes.config';
import { Container } from '@/infrastructure/di/Container';
import type { IDocumentTemplateRepository } from '@/modules/document-engine/domain/IDocumentTemplateRepository';
import type { IDocumentInstanceRepository } from '@/modules/document-engine/domain/IDocumentInstanceRepository';

describe('Multi-Role End-to-End Workflow Simulation', () => {
  // ── Mock Repositories & In-Memory Store ───────────────────────────────────
  let docTemplates: Map<string, any>;
  let docInstances: Map<string, any>;
  let entityStates: Map<string, string>;

  const mockTemplateRepo = {
    findByCode: vi.fn(async (code: string) => docTemplates.get(code) || null),
    findSignatureRules: vi.fn(async (code: string) => docTemplates.get(code)?.signatures || []),
    create: vi.fn(),
    update: vi.fn(),
    findActiveTemplates: vi.fn(async () => Array.from(docTemplates.values())),
  } as unknown as IDocumentTemplateRepository;

  const mockInstanceRepo = {
    findById: vi.fn(async (id: string) => docInstances.get(id) || null),
    findLatestByTemplateAndApplication: vi.fn(async (tmpl: string, appId: string) => {
      for (const inst of docInstances.values()) {
        if (inst.template_code === tmpl && inst.application_id === appId) return inst;
      }
      return null;
    }),
    findManyByApplicationId: vi.fn(async (appId: string) => {
      const list: any[] = [];
      for (const inst of docInstances.values()) {
        if (inst.application_id === appId) list.push(inst);
      }
      return list;
    }),
    findHistory: vi.fn(async () => []),
    create: vi.fn(async (data: any) => {
      const inst = { id: `inst-${Date.now()}`, ...data };
      docInstances.set(inst.id, inst);
      return inst;
    }),
    update: vi.fn(async (id: string, data: any) => {
      const existing = docInstances.get(id) || {};
      const updated = { ...existing, ...data };
      docInstances.set(id, updated);
      return updated;
    }),
    delete: vi.fn(),
  } as unknown as IDocumentInstanceRepository;

  const mockWorkflowStateRepo = {
    findActiveByWorkflowCode: vi.fn(async () => [
      { state_code: 'Drafting', label: 'Drafting', color: 'bg-slate-100', step_order: 1.0, is_terminal: false },
      { state_code: 'UnitVerification', label: 'Unit Verification', color: 'bg-blue-100', step_order: 2.0, is_terminal: false },
      { state_code: 'UnitSubmitted', label: 'Submitted to Area', color: 'bg-indigo-100', step_order: 3.0, is_terminal: false },
      { state_code: 'AreaReview', label: 'Area Review & Vetting', color: 'bg-purple-100', step_order: 4.0, is_terminal: false },
      { state_code: 'HQReview', label: 'HQ Review', color: 'bg-amber-100', step_order: 5.0, is_terminal: false },
      { state_code: 'ApexApproval', label: 'Apex Approval', color: 'bg-orange-100', step_order: 6.0, is_terminal: false },
      { state_code: 'Sanctioned', label: 'Sanctioned', color: 'bg-emerald-100', step_order: 7.0, is_terminal: true },
    ]),
  };

  const sigResolver = new DocumentSignatureRequirementResolver(mockTemplateRepo);
  const snapshotService = new WorkflowSnapshotQueryService();

  // Test Proposal Context
  const proposalId = 'prop-simulation-001';

  // ── Seeded Test Users & Roles ─────────────────────────────────────────────
  const users = {
    unitSurveyor: {
      userId: 'usr-surveyor-01',
      userName: 'Biswajit Nandi (Unit Surveyor)',
      role: 'Surveyor',
      user: {
        id: 'usr-surveyor-01',
        name: 'Biswajit Nandi',
        roles: ['Surveyor', 'Unit Officer'],
        permissions: [
          'project.view',
          'proposal.view',
          'proposal.edit',
          'form_xvi.sign.surveyor',
          'form_vii.sign.purchasing_survey_officer',
        ],
      },
    },
    collieryManager: {
      userId: 'usr-manager-01',
      userName: 'R. K. Sharma (Colliery Manager)',
      role: 'Colliery Manager',
      user: {
        id: 'usr-manager-01',
        name: 'R. K. Sharma',
        roles: ['Colliery Manager'],
        permissions: [
          'project.view',
          'proposal.view',
          'proposal.edit',
          'form_xvi.sign.manager',
          'form_vii.sign.purchasing_project_manager',
        ],
      },
    },
    projectAgent: {
      userId: 'usr-agent-01',
      userName: 'A. K. Verma (Project Agent)',
      role: 'Project Agent',
      user: {
        id: 'usr-agent-01',
        name: 'A. K. Verma',
        roles: ['Project Agent'],
        permissions: [
          'project.view',
          'proposal.view',
          'proposal.edit',
          'form_xvi.sign.agent',
          'form_vii.sign.purchasing_project_agent',
        ],
      },
    },
    areaLandOfficer: {
      userId: 'usr-area-01',
      userName: 'S. K. Singh (Area Land Officer)',
      role: 'Area Land Officer',
      user: {
        id: 'usr-area-01',
        name: 'S. K. Singh',
        roles: ['Area Land Officer', 'Area Officer'],
        permissions: [
          'project.view',
          'proposal.view',
          'proposal.approve',
          'form_vii.sign.purchasing_area_land_officer',
          'form_xxii.sign.area_land_officer',
        ],
      },
    },
    areaGm: {
      userId: 'usr-areagm-01',
      userName: 'D. K. Roy (Area GM)',
      role: 'Area General Manager',
      user: {
        id: 'usr-areagm-01',
        name: 'D. K. Roy',
        roles: ['Area General Manager'],
        permissions: [
          'project.view',
          'proposal.view',
          'proposal.approve',
          'form_vii.sign.purchasing_area_gm',
          'form_xxii.sign.area_gm',
        ],
      },
    },
    gmLre: {
      userId: 'usr-gmlre-01',
      userName: 'P. Sengupta (GM LRE)',
      role: 'GM LRE',
      user: {
        id: 'usr-gmlre-01',
        name: 'P. Sengupta',
        roles: ['GM LRE'],
        permissions: ['project.view', 'proposal.view', 'proposal.approve', 'workflow.approve'],
      },
    },
    cmd: {
      userId: 'usr-cmd-01',
      userName: 'Chairman & Managing Director',
      role: 'Director',
      user: {
        id: 'usr-cmd-01',
        name: 'CMD',
        roles: ['Director'],
        permissions: ['*'],
      },
    },
  };

  beforeEach(() => {
    docTemplates = new Map();
    docInstances = new Map();
    entityStates = new Map();

    // 1. Setup Form-XVI Template with 3-Step Unit Verification Signature Rules
    docTemplates.set('FORM_XVI', {
      id: 'tmpl-form-xvi',
      template_code: 'FORM_XVI',
      template_name: 'Form-XVI (Five-Point Certificate)',
      description: 'Unit level five-point certificate requiring Surveyor, Manager, and Agent signatures',
      workflow_state: 'UnitVerification',
      category: 'CHECKLIST',
      is_active: true,
      file_path: '/templates/form_xvi.docx',
      created_at: new Date(),
      updated_at: new Date(),
      signatures: [
        {
          id: 'sig-1',
          template_code: 'FORM_XVI',
          sig_permission: 'form_xvi.sign.surveyor',
          workflow_state: 'UnitVerification',
          display_order: 1,
          is_required: true,
          placeholders: { label: 'Surveyor Signature' },
        },
        {
          id: 'sig-2',
          template_code: 'FORM_XVI',
          sig_permission: 'form_xvi.sign.manager',
          workflow_state: 'UnitVerification',
          display_order: 2,
          is_required: true,
          placeholders: { label: 'Colliery Manager Signature' },
        },
        {
          id: 'sig-3',
          template_code: 'FORM_XVI',
          sig_permission: 'form_xvi.sign.agent',
          workflow_state: 'UnitVerification',
          display_order: 3,
          is_required: true,
          placeholders: { label: 'Project Agent Signature' },
        },
      ],
    });

    // 2. Setup Form-XXII Template with Area Review Signature Rules
    docTemplates.set('FORM_XXII', {
      id: 'tmpl-form-xxii',
      template_code: 'FORM_XXII',
      template_name: 'Form-XXII (Area Land Cell Clearance)',
      description: 'Area land clearance certificate requiring ALDO and Area GM signatures',
      workflow_state: 'AreaReview',
      category: 'CHECKLIST',
      is_active: true,
      file_path: '/templates/form_xxii.docx',
      created_at: new Date(),
      updated_at: new Date(),
      signatures: [
        {
          id: 'sig-21',
          template_code: 'FORM_XXII',
          sig_permission: 'form_xxii.sign.area_land_officer',
          workflow_state: 'AreaReview',
          display_order: 1,
          is_required: true,
          placeholders: { label: 'Area Land Officer Signature' },
        },
        {
          id: 'sig-22',
          template_code: 'FORM_XXII',
          sig_permission: 'form_xxii.sign.area_gm',
          workflow_state: 'AreaReview',
          display_order: 2,
          is_required: true,
          placeholders: { label: 'Area General Manager Signature' },
        },
      ],
    });

    // Wire Mock Repositories into Container
    (Container as any).documentTemplateRepository = mockTemplateRepo;
    (Container as any).documentInstanceRepository = mockInstanceRepo;
    (Container as any).documentSignatureRequirementResolver = sigResolver;
    (Container as any).workflowStateRepository = mockWorkflowStateRepo;

    // Default initial entity state
    entityStates.set(proposalId, 'UnitVerification');
    mockProposalDb.set(proposalId, {
      proposal_id: proposalId,
      current_stage_cd: 'UnitVerification',
      overall_status: 'IN_PROGRESS',
      proposal_title: 'Test Land Acquisition Proposal',
      area_cd: 'ECL_AREA_01',
      mine_cd: 'ECL_MINE_01',
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SIMULATION PHASE 1: FORM-XVI SEQUENTIAL UNIT SIGNATURE MATRIX
  // ══════════════════════════════════════════════════════════════════════════
  it('Phase 1.1: Before any signatures, only Unit Surveyor is ACTIONABLE_BY_ME, while Manager & Agent are WAITING_ON_ASSIGNEE', async () => {
    // Document instance generated with empty signatures
    const formXVIInstance = {
      id: 'inst-form-xvi-001',
      template_code: 'FORM_XVI',
      application_id: proposalId,
      status: 'DRAFT',
      signature_data_json: [],
      document_template: docTemplates.get('FORM_XVI'),
    };
    docInstances.set(formXVIInstance.id, formXVIInstance);

    // 1. Evaluate Snapshot for Unit Surveyor
    const surveyorSnapshot = await snapshotService.getSnapshot(
      MODULE_CODES.LAND_SCHEDULE,
      CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE,
      proposalId,
      users.unitSurveyor
    );

    const surveyorSigAction = surveyorSnapshot.currentAssignment.pendingActions.find(
      (a) => a.code === 'SIGN_FORM_XVI' || a.id.includes('FORM_XVI')
    );

    expect(surveyorSigAction).toBeDefined();
    expect(surveyorSigAction?.isAuthorizedForCurrentUser).toBe(true);
    expect(surveyorSigAction?.classification).toBe('ACTIONABLE_BY_ME');
    expect(surveyorSigAction?.status).toBe('PENDING');

    // 2. Evaluate Snapshot for Colliery Manager (Must be waiting on surveyor)
    const managerSnapshot = await snapshotService.getSnapshot(
      MODULE_CODES.LAND_SCHEDULE,
      CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE,
      proposalId,
      users.collieryManager
    );

    const managerSigAction = managerSnapshot.currentAssignment.pendingActions.find(
      (a) => a.code === 'SIGN_FORM_XVI' || a.id.includes('FORM_XVI')
    );

    expect(managerSigAction).toBeDefined();
    expect(managerSigAction?.isAuthorizedForCurrentUser).toBe(false);
    expect(managerSigAction?.classification).toBe('WAITING_ON_ASSIGNEE');
    expect(managerSigAction?.requiredPermission).toBe('form_xvi.sign.surveyor');

    // 3. Evaluate Snapshot for Project Agent (Must be waiting on surveyor)
    const agentSnapshot = await snapshotService.getSnapshot(
      MODULE_CODES.LAND_SCHEDULE,
      CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE,
      proposalId,
      users.projectAgent
    );

    const agentSigAction = agentSnapshot.currentAssignment.pendingActions.find(
      (a) => a.code === 'SIGN_FORM_XVI' || a.id.includes('FORM_XVI')
    );

    expect(agentSigAction?.isAuthorizedForCurrentUser).toBe(false);
    expect(agentSigAction?.classification).toBe('WAITING_ON_ASSIGNEE');
  });

  it('Phase 1.2: After Unit Surveyor signs, Colliery Manager becomes ACTIONABLE_BY_ME, while Agent remains WAITING_ON_ASSIGNEE', async () => {
    // Surveyor applies signature (Step 1 complete)
    const formXVIInstance = {
      id: 'inst-form-xvi-001',
      template_code: 'FORM_XVI',
      application_id: proposalId,
      status: 'DRAFT',
      signature_data_json: [
        {
          permission: 'form_xvi.sign.surveyor',
          signed_by_name: 'Biswajit Nandi',
          signed_by_role: 'Unit Surveyor',
          signed_at: new Date().toISOString(),
          status: 'APPLIED',
        },
      ],
      document_template: docTemplates.get('FORM_XVI'),
    };
    docInstances.set(formXVIInstance.id, formXVIInstance);

    // 1. Colliery Manager Snapshot
    const managerSnapshot = await snapshotService.getSnapshot(
      MODULE_CODES.LAND_SCHEDULE,
      CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE,
      proposalId,
      users.collieryManager
    );

    const managerSigAction = managerSnapshot.currentAssignment.pendingActions.find(
      (a) => a.code === 'SIGN_FORM_XVI' || a.id.includes('FORM_XVI')
    );

    expect(managerSigAction?.isAuthorizedForCurrentUser).toBe(true);
    expect(managerSigAction?.classification).toBe('ACTIONABLE_BY_ME');
    expect(managerSigAction?.description).toContain('1/3');

    // 2. Project Agent Snapshot
    const agentSnapshot = await snapshotService.getSnapshot(
      MODULE_CODES.LAND_SCHEDULE,
      CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE,
      proposalId,
      users.projectAgent
    );

    const agentSigAction = agentSnapshot.currentAssignment.pendingActions.find(
      (a) => a.code === 'SIGN_FORM_XVI' || a.id.includes('FORM_XVI')
    );

    expect(agentSigAction?.isAuthorizedForCurrentUser).toBe(false);
    expect(agentSigAction?.classification).toBe('WAITING_ON_ASSIGNEE');
    expect(agentSigAction?.requiredPermission).toBe('form_xvi.sign.manager');
  });

  it('Phase 1.3: After Colliery Manager signs, Project Agent becomes ACTIONABLE_BY_ME', async () => {
    // Surveyor + Manager signed (Steps 1 & 2 complete)
    const formXVIInstance = {
      id: 'inst-form-xvi-001',
      template_code: 'FORM_XVI',
      application_id: proposalId,
      status: 'DRAFT',
      signature_data_json: [
        {
          permission: 'form_xvi.sign.surveyor',
          signed_by_name: 'Biswajit Nandi',
          signed_by_role: 'Unit Surveyor',
          signed_at: new Date().toISOString(),
          status: 'APPLIED',
        },
        {
          permission: 'form_xvi.sign.manager',
          signed_by_name: 'R. K. Sharma',
          signed_by_role: 'Colliery Manager',
          signed_at: new Date().toISOString(),
          status: 'APPLIED',
        },
      ],
      document_template: docTemplates.get('FORM_XVI'),
    };
    docInstances.set(formXVIInstance.id, formXVIInstance);

    const agentSnapshot = await snapshotService.getSnapshot(
      MODULE_CODES.LAND_SCHEDULE,
      CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE,
      proposalId,
      users.projectAgent
    );

    const agentSigAction = agentSnapshot.currentAssignment.pendingActions.find(
      (a) => a.code === 'SIGN_FORM_XVI' || a.id.includes('FORM_XVI')
    );

    expect(agentSigAction?.isAuthorizedForCurrentUser).toBe(true);
    expect(agentSigAction?.classification).toBe('ACTIONABLE_BY_ME');
    expect(agentSigAction?.description).toContain('2/3');
  });

  it('Phase 1.4: After Project Agent signs, Form-XVI is COMPLETED and stage signature requirement is 100% satisfied', async () => {
    // All 3 signatures applied
    const formXVIInstance = {
      id: 'inst-form-xvi-001',
      template_code: 'FORM_XVI',
      application_id: proposalId,
      status: 'COMPLETED',
      signature_data_json: [
        { permission: 'form_xvi.sign.surveyor', signed_by_name: 'Biswajit Nandi', status: 'APPLIED' },
        { permission: 'form_xvi.sign.manager', signed_by_name: 'R. K. Sharma', status: 'APPLIED' },
        { permission: 'form_xvi.sign.agent', signed_by_name: 'A. K. Verma', status: 'APPLIED' },
      ],
      document_template: docTemplates.get('FORM_XVI'),
    };
    docInstances.set(formXVIInstance.id, formXVIInstance);

    // Direct Signature Resolver Verification
    const sigRes = await sigResolver.resolve('FORM_XVI', formXVIInstance.signature_data_json, 'UnitVerification');
    expect(sigRes.fullyCompleted).toBe(true);
    expect(sigRes.allCurrentStageSatisfied).toBe(true);
    expect(sigRes.completedCount).toBe(3);
    expect(sigRes.totalRequired).toBe(3);

    // Snapshot Verification for any user
    const snapshot = await snapshotService.getSnapshot(
      MODULE_CODES.LAND_SCHEDULE,
      CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE,
      proposalId,
      users.projectAgent
    );

    const sigAction = snapshot.currentAssignment.pendingActions.find(
      (a) => a.code === 'SIGN_FORM_XVI' || a.id.includes('FORM_XVI')
    );

    expect(sigAction?.status).toBe('COMPLETED');
    expect(sigAction?.classification).toBe('COMPLETED');
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SIMULATION PHASE 2: AREA REVIEW & FORM-XXII CLEARANCE
  // ══════════════════════════════════════════════════════════════════════════
  it('Phase 2.1: In AreaReview, Form-XXII is ACTIONABLE_BY_ME for Area Land Officer, then Area GM', async () => {
    entityStates.set(proposalId, 'AreaReview');
    mockProposalDb.set(proposalId, {
      proposal_id: proposalId,
      current_stage_cd: 'AreaReview',
      overall_status: 'IN_PROGRESS',
      proposal_title: 'Test Land Acquisition Proposal',
    });

    const formXXIIInstance: any = {
      id: 'inst-form-xxii-001',
      template_code: 'FORM_XXII',
      application_id: proposalId,
      status: 'DRAFT',
      signature_data_json: [] as any[],
      document_template: docTemplates.get('FORM_XXII'),
    };
    docInstances.set(formXXIIInstance.id, formXXIIInstance);

    // 1. Area Land Officer Snapshot
    const aldoSnapshot = await snapshotService.getSnapshot(
      MODULE_CODES.LAND_SCHEDULE,
      CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE,
      proposalId,
      users.areaLandOfficer
    );

    const aldoAction = aldoSnapshot.currentAssignment.pendingActions.find(
      (a) => a.code === 'SIGN_FORM_XXII' || a.id.includes('FORM_XXII')
    );

    expect(aldoAction?.isAuthorizedForCurrentUser).toBe(true);
    expect(aldoAction?.classification).toBe('ACTIONABLE_BY_ME');

    // 2. Apply Area Land Officer Signature
    formXXIIInstance.signature_data_json = [
      { permission: 'form_xxii.sign.area_land_officer', signed_by_name: 'S. K. Singh', status: 'APPLIED' },
    ];

    // 3. Area GM Snapshot
    const areagmSnapshot = await snapshotService.getSnapshot(
      MODULE_CODES.LAND_SCHEDULE,
      CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE,
      proposalId,
      users.areaGm
    );

    const areagmAction = areagmSnapshot.currentAssignment.pendingActions.find(
      (a) => a.code === 'SIGN_FORM_XXII' || a.id.includes('FORM_XXII')
    );

    expect(areagmAction?.isAuthorizedForCurrentUser).toBe(true);
    expect(areagmAction?.classification).toBe('ACTIONABLE_BY_ME');

    // 4. Apply Area GM Signature -> Form-XXII Completed
    formXXIIInstance.signature_data_json.push({
      permission: 'form_xxii.sign.area_gm',
      signed_by_name: 'D. K. Roy',
      status: 'APPLIED',
    });

    const finalSigRes = await sigResolver.resolve('FORM_XXII', formXXIIInstance.signature_data_json, 'AreaReview');
    expect(finalSigRes.allCurrentStageSatisfied).toBe(true);
    expect(finalSigRes.fullyCompleted).toBe(true);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SIMULATION PHASE 3: SUMMARY COUNTERS & CAPABILITIES
  // ══════════════════════════════════════════════════════════════════════════
  it('Phase 3.1: Pending work summary counters accurately reflect actionable vs waiting vs completed tasks', async () => {
    entityStates.set(proposalId, 'UnitVerification');

    // 1 Completed doc (Form-XVI) + 1 Pending doc (Form-XXII not signed)
    docInstances.set('inst-1', {
      id: 'inst-1',
      template_code: 'FORM_XVI',
      application_id: proposalId,
      status: 'COMPLETED',
      signature_data_json: [
        { permission: 'form_xvi.sign.surveyor', status: 'APPLIED' },
        { permission: 'form_xvi.sign.manager', status: 'APPLIED' },
        { permission: 'form_xvi.sign.agent', status: 'APPLIED' },
      ],
      document_template: docTemplates.get('FORM_XVI'),
    });

    docInstances.set('inst-2', {
      id: 'inst-2',
      template_code: 'FORM_XXII',
      application_id: proposalId,
      status: 'DRAFT',
      signature_data_json: [],
      document_template: docTemplates.get('FORM_XXII'),
    });

    const snapshot = await snapshotService.getSnapshot(
      MODULE_CODES.LAND_SCHEDULE,
      CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE,
      proposalId,
      users.unitSurveyor
    );

    expect(snapshot.pendingWorkSummary).toBeDefined();
    expect(snapshot.pendingWorkSummary?.completedCount).toBeGreaterThanOrEqual(1);
    expect(typeof snapshot.pendingWorkSummary?.actionableByMeCount).toBe('number');
    expect(typeof snapshot.pendingWorkSummary?.waitingOnOthersCount).toBe('number');
  });
});
