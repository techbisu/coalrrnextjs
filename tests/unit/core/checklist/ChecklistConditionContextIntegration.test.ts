import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GetChecklistStatusUseCase } from '@/core/checklist/usecases/GetChecklistStatusUseCase'
import { IChecklistRepository } from '@/core/checklist/interfaces/IChecklistRepository'
import { ChecklistContextRegistry } from '@/core/checklist/registry/ChecklistContextRegistry'
import { ProposalChecklistResolver } from '@/core/proposal/checklist/ProposalChecklistResolver'
import { FactResolver } from '@/core/flags/services/FactResolver'
import { ConditionContextBuilder } from '@/core/flags/services/ConditionContextBuilder'
import { IFactSourceAdapter } from '@/core/flags/interfaces/IFactSourceAdapter'
import { GeneratedDocumentChecklistAdapter } from '@/core/checklist/services/GeneratedDocumentChecklistAdapter'
import { ACQ_LAND_SCHEDULE, MODULE_CODES, CHECKABLE_ENTITY_TYPES } from '@/core/config/module-codes.config'

describe('Phase 3 — Checklist Engine & ConditionContext Integration Tests', () => {
  let mockRepo: IChecklistRepository
  let mockFlagRepo: any
  let mockDocRepo: any
  let factResolver: FactResolver
  let contextBuilder: ConditionContextBuilder
  let mockProposalRepo: any
  let proposalResolver: ProposalChecklistResolver
  let registry: ChecklistContextRegistry
  let docAdapter: GeneratedDocumentChecklistAdapter
  let useCase: GetChecklistStatusUseCase

  beforeEach(() => {
    mockRepo = {
      findRulesByModule: vi.fn(),
      findSubmissions: vi.fn(),
      findSubmission: vi.fn(),
      upsertSubmission: vi.fn(),
    }

    mockFlagRepo = {
      getAll: vi.fn().mockResolvedValue([]),
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn(),
      delete: vi.fn(),
    }

    mockDocRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findLatestByTemplateAndApplication: vi.fn().mockResolvedValue(null),
      saveFormData: vi.fn(),
      saveGeneratedPdf: vi.fn(),
      appendSignature: vi.fn(),
      appendReviewDecision: vi.fn(),
    }

    factResolver = new FactResolver(mockFlagRepo)
    contextBuilder = new ConditionContextBuilder(factResolver)

    mockProposalRepo = {
      getProposalById: vi.fn().mockResolvedValue({
        proposal_id: 'prop_001',
        proposal_no: 'PROP/2026/001',
        acq_mode_id: 2,
        current_stage_cd: 'Drafting',
        requires_board_approval: true,
        has_tribal_land: false,
        has_debottar_land: false,
        is_disputed_land: false,
        has_formal_negotiation: false,
        tot_acq_area: '150.5000',
        proj_cd: 'PROJ_X',
      }),
    }

    // Register adapter for acq_land_schedule
    const mockAdapter: IFactSourceAdapter = {
      entityType: CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE,
      resolveDomainFacts: vi.fn().mockImplementation(async (id: string) => {
        const prop = await mockProposalRepo.getProposalById(id)
        return {
          acq_mode: Number(prop.acq_mode_id),
          acq_mode_id: Number(prop.acq_mode_id),
          acqModeId: Number(prop.acq_mode_id),
          stage: prop.current_stage_cd,
          current_stage_cd: prop.current_stage_cd,
          requires_board_approval: prop.requires_board_approval,
          is_board_approval_req: prop.requires_board_approval,
          has_tribal_land: prop.has_tribal_land,
          has_debottar_land: prop.has_debottar_land,
          is_disputed_land: prop.is_disputed_land,
          has_formal_negotiation: prop.has_formal_negotiation,
          total_area_acres: Number(prop.tot_acq_area),
          tot_acq_area: Number(prop.tot_acq_area),
          plot_count: 0,
          has_plots: false,
        }
      }),
    }
    factResolver.registerAdapter(mockAdapter)

    proposalResolver = new ProposalChecklistResolver(mockProposalRepo, contextBuilder)
    registry = new ChecklistContextRegistry()
    registry.register(MODULE_CODES.LAND_SCHEDULE, proposalResolver)

    docAdapter = new GeneratedDocumentChecklistAdapter(mockDocRepo, mockRepo)
    useCase = new GetChecklistStatusUseCase(mockRepo, registry, docAdapter)
  })

  // Test A: Drafting + zero plots -> Add Plot Schedule = PENDING
  it('A. Drafting + zero plots -> Add Plot Schedule = PENDING', async () => {
    const rules = [
      {
        id: 'rule_plot',
        chk_id: 'rule_plot',
        chk_code: 'ADD_PLOT_SCHEDULE',
        title: 'Add Plot Schedule',
        requirement_type: 'input',
        is_mandatory: true,
      },
    ]

    vi.spyOn(mockRepo, 'findRulesByModule').mockResolvedValue(rules as any)
    vi.spyOn(mockRepo, 'findSubmissions').mockResolvedValue([])

    const result = await useCase.execute({
      moduleCode: MODULE_CODES.LAND_SCHEDULE,
      checkableType: ACQ_LAND_SCHEDULE,
      checkableId: 'prop_001',
    })

    expect(result.isSuccess).toBe(true)
    const data = result.value
    expect(data.isComplete).toBe(false)
    expect(data.items[0].chkCode).toBe('ADD_PLOT_SCHEDULE')
    expect(data.items[0].submission).toBeNull()
  })

  // Test B: Drafting + plots exist -> Add Plot Schedule = COMPLETED
  it('B. Drafting + plots exist -> Add Plot Schedule = COMPLETED (AUTO_SATISFIED)', async () => {
    const mockAdapter: IFactSourceAdapter = {
      entityType: CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE,
      resolveDomainFacts: vi.fn().mockResolvedValue({
        acq_mode_id: 2,
        plot_count: 5,
        has_plots: true,
      }),
    }
    factResolver.registerAdapter(mockAdapter)

    const rules = [
      {
        id: 'rule_plot',
        chk_id: 'rule_plot',
        chk_code: 'ADD_PLOT_SCHEDULE',
        title: 'Add Plot Schedule',
        requirement_type: 'input',
        is_mandatory: true,
      },
    ]

    vi.spyOn(mockRepo, 'findRulesByModule').mockResolvedValue(rules as any)
    vi.spyOn(mockRepo, 'findSubmissions').mockResolvedValue([])

    const result = await useCase.execute({
      moduleCode: MODULE_CODES.LAND_SCHEDULE,
      checkableType: ACQ_LAND_SCHEDULE,
      checkableId: 'prop_001',
    })

    expect(result.isSuccess).toBe(true)
    const data = result.value
    expect(data.isComplete).toBe(true)
    expect(data.items[0].submission.status).toBe('AUTO_SATISFIED')
  })

  // Test C: Form-XXII applicable mode -> requirement applicable
  it('C. Form-XXII applicable mode (acq_mode in [1, 2, 6]) -> requirement applicable', async () => {
    const rules = [
      {
        id: 'rule_form_xxii',
        chk_id: 'rule_form_xxii',
        chk_code: 'REQ_FORM_XXII',
        title: 'Form-XXII Public Notice',
        is_mandatory: true,
        show_if: { op: 'in', field: 'acq_mode', value: [1, 2, 6] },
      },
    ]

    vi.spyOn(mockRepo, 'findRulesByModule').mockResolvedValue(rules as any)
    vi.spyOn(mockRepo, 'findSubmissions').mockResolvedValue([])

    const result = await useCase.execute({
      moduleCode: MODULE_CODES.LAND_SCHEDULE,
      checkableType: ACQ_LAND_SCHEDULE,
      checkableId: 'prop_001',
    })

    expect(result.isSuccess).toBe(true)
    expect(result.value.items).toHaveLength(1)
    expect(result.value.items[0].chkCode).toBe('REQ_FORM_XXII')
  })

  // Test D: Form-XXII non-applicable mode -> NOT_APPLICABLE (filtered out)
  it('D. Form-XXII non-applicable mode (acq_mode = 3) -> requirement NOT_APPLICABLE', async () => {
    mockProposalRepo.getProposalById.mockResolvedValueOnce({
      proposal_id: 'prop_001',
      acq_mode_id: 3,
      current_stage_cd: 'Drafting',
    })

    const rules = [
      {
        id: 'rule_form_xxii',
        chk_id: 'rule_form_xxii',
        chk_code: 'REQ_FORM_XXII',
        title: 'Form-XXII Public Notice',
        is_mandatory: true,
        show_if: { op: 'in', field: 'acq_mode', value: [1, 2, 6] },
      },
    ]

    vi.spyOn(mockRepo, 'findRulesByModule').mockResolvedValue(rules as any)
    vi.spyOn(mockRepo, 'findSubmissions').mockResolvedValue([])

    const result = await useCase.execute({
      moduleCode: MODULE_CODES.LAND_SCHEDULE,
      checkableType: ACQ_LAND_SCHEDULE,
      checkableId: 'prop_001',
    })

    expect(result.isSuccess).toBe(true)
    expect(result.value.items).toHaveLength(0)
  })

  // Test E: Rehabilitation condition false -> R&R requirement not applicable
  it('E. Rehabilitation condition false -> R&R requirement not applicable', async () => {
    const rules = [
      {
        id: 'rule_randr',
        chk_id: 'rule_randr',
        chk_code: 'REQ_RANDR_PLAN',
        title: 'Rehabilitation Plan',
        is_mandatory: true,
        show_if: { field: 'has_displacement', op: 'eq', value: true },
      },
    ]

    vi.spyOn(mockRepo, 'findRulesByModule').mockResolvedValue(rules as any)
    vi.spyOn(mockRepo, 'findSubmissions').mockResolvedValue([])

    const result = await useCase.execute({
      moduleCode: MODULE_CODES.LAND_SCHEDULE,
      checkableType: ACQ_LAND_SCHEDULE,
      checkableId: 'prop_001',
    })

    expect(result.isSuccess).toBe(true)
    expect(result.value.items).toHaveLength(0)
  })

  // Test F: Rehabilitation condition true -> R&R requirement applicable
  it('F. Rehabilitation condition true -> R&R requirement applicable', async () => {
    const mockAdapter: IFactSourceAdapter = {
      entityType: CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE,
      resolveDomainFacts: vi.fn().mockResolvedValue({
        acq_mode_id: 2,
        has_displacement: true,
      }),
    }
    factResolver.registerAdapter(mockAdapter)

    const rules = [
      {
        id: 'rule_randr',
        chk_id: 'rule_randr',
        chk_code: 'REQ_RANDR_PLAN',
        title: 'Rehabilitation Plan',
        is_mandatory: true,
        show_if: { field: 'has_displacement', op: 'eq', value: true },
      },
    ]

    vi.spyOn(mockRepo, 'findRulesByModule').mockResolvedValue(rules as any)
    vi.spyOn(mockRepo, 'findSubmissions').mockResolvedValue([])

    const result = await useCase.execute({
      moduleCode: MODULE_CODES.LAND_SCHEDULE,
      checkableType: ACQ_LAND_SCHEDULE,
      checkableId: 'prop_001',
    })

    expect(result.isSuccess).toBe(true)
    expect(result.value.items).toHaveLength(1)
    expect(result.value.items[0].chkCode).toBe('REQ_RANDR_PLAN')
  })

  // Test G: Document generated but review pending -> REVIEW = PENDING
  it('G. Document generated but review pending -> REVIEW = PENDING', async () => {
    mockDocRepo.findLatestByTemplateAndApplication.mockResolvedValueOnce({
      id: 'doc_inst_1',
      generated_docx_path: '/docs/form_xxii.docx',
      review_data_json: [],
    } as any)

    const rule = {
      id: 'rule_doc',
      chk_id: 'rule_doc',
      chk_code: 'FORM_XXII_DOC',
      requirement_type: 'document',
      input_schema: {
        type: 'generated_document',
        template_code: 'FORM_XXII',
        completion_steps: [{ type: 'GENERATE' }, { type: 'REVIEW' }],
      },
    }

    vi.spyOn(mockRepo, 'findRulesByModule').mockResolvedValue([rule] as any)
    vi.spyOn(mockRepo, 'findSubmissions').mockResolvedValue([])

    const result = await useCase.execute({
      moduleCode: MODULE_CODES.LAND_SCHEDULE,
      checkableType: ACQ_LAND_SCHEDULE,
      checkableId: 'prop_001',
    })

    expect(result.isSuccess).toBe(true)
    const item = result.value.items[0]
    expect(item.generatedDocInfo.status).toBe('DRAFT')
    const reviewStep = item.generatedDocInfo.stepDetails.find((s: any) => s.type === 'REVIEW')
    expect(reviewStep.status).toBe('PENDING')
  })

  // Test H: Review complete -> REVIEW = COMPLETED
  it('H. Review complete -> REVIEW = COMPLETED', async () => {
    mockDocRepo.findLatestByTemplateAndApplication.mockResolvedValueOnce({
      id: 'doc_inst_1',
      generated_docx_path: '/docs/form_xxii.docx',
      review_data_json: [{ decision: 'APPROVED', reviewer: 'area_gm' }],
    } as any)

    const rule = {
      id: 'rule_doc',
      chk_id: 'rule_doc',
      chk_code: 'FORM_XXII_DOC',
      requirement_type: 'document',
      input_schema: {
        type: 'generated_document',
        template_code: 'FORM_XXII',
        completion_steps: [{ type: 'GENERATE' }, { type: 'REVIEW' }],
      },
    }

    vi.spyOn(mockRepo, 'findRulesByModule').mockResolvedValue([rule] as any)
    vi.spyOn(mockRepo, 'findSubmissions').mockResolvedValue([])

    const result = await useCase.execute({
      moduleCode: MODULE_CODES.LAND_SCHEDULE,
      checkableType: ACQ_LAND_SCHEDULE,
      checkableId: 'prop_001',
    })

    expect(result.isSuccess).toBe(true)
    const item = result.value.items[0]
    expect(item.generatedDocInfo.status).toBe('COMPLETED')
    const reviewStep = item.generatedDocInfo.stepDetails.find((s: any) => s.type === 'REVIEW')
    expect(reviewStep.status).toBe('COMPLETED')
  })

  // Test I: Signature required but not signed -> SIGN = PENDING
  it('I. Signature required but not signed -> SIGN = PENDING', async () => {
    mockDocRepo.findLatestByTemplateAndApplication.mockResolvedValueOnce({
      id: 'doc_inst_1',
      generated_docx_path: '/docs/form_xxii.docx',
      resolver_signatures_json: [{ role: 'AREA_GM', is_required: true }],
      signature_data_json: [],
    } as any)

    const rule = {
      id: 'rule_doc_sig',
      chk_id: 'rule_doc_sig',
      chk_code: 'FORM_XXII_DOC',
      requirement_type: 'document',
      input_schema: {
        type: 'generated_document',
        template_code: 'FORM_XXII',
        completion_steps: [{ type: 'GENERATE' }, { type: 'SIGN', permission: 'form_xxii.sign' }],
      },
    }

    vi.spyOn(mockRepo, 'findRulesByModule').mockResolvedValue([rule] as any)
    vi.spyOn(mockRepo, 'findSubmissions').mockResolvedValue([])

    const result = await useCase.execute({
      moduleCode: MODULE_CODES.LAND_SCHEDULE,
      checkableType: ACQ_LAND_SCHEDULE,
      checkableId: 'prop_001',
    })

    expect(result.isSuccess).toBe(true)
    const item = result.value.items[0]
    const signStep = item.generatedDocInfo.stepDetails.find((s: any) => s.type === 'SIGN')
    expect(signStep.status).toBe('PENDING')
  })

  // Test J: Signature complete -> SIGN = COMPLETED
  it('J. Signature complete -> SIGN = COMPLETED', async () => {
    mockDocRepo.findLatestByTemplateAndApplication.mockResolvedValueOnce({
      id: 'doc_inst_1',
      generated_docx_path: '/docs/form_xxii.docx',
      resolver_signatures_json: [{ role: 'AREA_GM', is_required: true }],
      signature_data_json: [{ role: 'AREA_GM', signed_at: new Date().toISOString() }],
    } as any)

    const rule = {
      id: 'rule_doc_sig',
      chk_id: 'rule_doc_sig',
      chk_code: 'FORM_XXII_DOC',
      requirement_type: 'document',
      input_schema: {
        type: 'generated_document',
        template_code: 'FORM_XXII',
        completion_steps: [{ type: 'GENERATE' }, { type: 'SIGN', permission: 'form_xxii.sign' }],
      },
    }

    vi.spyOn(mockRepo, 'findRulesByModule').mockResolvedValue([rule] as any)
    vi.spyOn(mockRepo, 'findSubmissions').mockResolvedValue([])

    const result = await useCase.execute({
      moduleCode: MODULE_CODES.LAND_SCHEDULE,
      checkableType: ACQ_LAND_SCHEDULE,
      checkableId: 'prop_001',
    })

    expect(result.isSuccess).toBe(true)
    const item = result.value.items[0]
    expect(item.generatedDocInfo.status).toBe('COMPLETED')
    const signStep = item.generatedDocInfo.stepDetails.find((s: any) => s.type === 'SIGN')
    expect(signStep.status).toBe('COMPLETED')
  })

  // Test K: Required permission missing -> canCurrentUserAct = false
  it('K. Required permission missing -> canCurrentUserAct = false', async () => {
    mockDocRepo.findLatestByTemplateAndApplication.mockResolvedValueOnce({
      id: 'doc_inst_1',
      generated_docx_path: '/docs/form_xxii.docx',
      resolver_signatures_json: [{ role: 'AREA_GM', is_required: true }],
      signature_data_json: [],
    } as any)

    const rule = {
      id: 'rule_doc_perm',
      chk_id: 'rule_doc_perm',
      chk_code: 'FORM_XXII_DOC',
      requirement_type: 'document',
      input_schema: {
        type: 'generated_document',
        template_code: 'FORM_XXII',
        completion_steps: [{ type: 'GENERATE' }, { type: 'SIGN', permission: 'form_xxii.sign' }],
      },
    }

    vi.spyOn(mockRepo, 'findRulesByModule').mockResolvedValue([rule] as any)
    vi.spyOn(mockRepo, 'findSubmissions').mockResolvedValue([])

    const req: any = {
      moduleCode: MODULE_CODES.LAND_SCHEDULE,
      checkableType: ACQ_LAND_SCHEDULE,
      checkableId: 'prop_001',
      userPermissions: ['other.permission'],
    }

    const result = await useCase.execute(req)
    expect(result.isSuccess).toBe(true)
    const item = result.value.items[0]
    expect(item.generatedDocInfo.nextAction.canCurrentUserAct).toBe(false)
  })

  // Test L: User scope does not match -> user action unavailable
  it('L. User scope does not match -> user action unavailable', async () => {
    const req: any = {
      moduleCode: MODULE_CODES.LAND_SCHEDULE,
      checkableType: ACQ_LAND_SCHEDULE,
      checkableId: 'prop_001',
      userPermissions: ['unit.read_only'],
    }

    vi.spyOn(mockRepo, 'findRulesByModule').mockResolvedValue([])
    vi.spyOn(mockRepo, 'findSubmissions').mockResolvedValue([])

    const result = await useCase.execute(req)
    expect(result.isSuccess).toBe(true)
  })

  // Test M: Authoritative flag -> facts.requires_board_approval = true from entity_flag
  it('M. Authoritative flag (requires_board_approval = true) resolved via FactResolver', async () => {
    mockFlagRepo.getAll.mockResolvedValueOnce([
      {
        id: 'flag_001',
        entity_type: CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE,
        entity_id: 'prop_001',
        flag_code: 'requires_board_approval',
        flag_value: true,
        source: 'SYSTEM',
        entry_ts: new Date(),
        updt_ts: new Date(),
        entry_by: 'admin',
        updt_by: null,
      },
    ])

    const context = await contextBuilder.buildContext(CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE, 'prop_001')
    expect(context.getBoolean('requires_board_approval')).toBe(true)
  })

  // Test N: Authoritative flag value update -> resolved correctly via FactResolver
  it('N. Authoritative flag value update -> resolved correctly via FactResolver', async () => {
    mockFlagRepo.getAll.mockResolvedValueOnce([
      {
        id: 'flag_001',
        entity_type: CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE,
        entity_id: 'prop_001',
        flag_code: 'requires_board_approval',
        flag_value: false,
        source: 'SYSTEM',
        entry_ts: new Date(),
        updt_ts: new Date(),
        entry_by: 'admin',
        updt_by: null,
      },
    ])

    const context = await contextBuilder.buildContext(CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE, 'prop_001')
    expect(context.getBoolean('requires_board_approval')).toBe(false)
  })
})
