/**
 * Proposal Aggregate Root - Core domain entity for land acquisition proposals.
 * Encapsulates all business rules and invariants for proposal/schedule management.
 * (Triggering recompile)
 */
import { AggregateRoot } from '@/core/base/AggregateRoot'
import { Result, Fail } from '@/core/result/Result'
import { ValidationException, DomainException } from '@/core/errors'
import { createDomainEvent } from '@/core/base/DomainEvent'
import { Area } from '@/domain/value-objects/Area'
import { ProposalId } from './ProposalId'
import { ScheduleCode } from './ScheduleCode'
import { ProposalState } from './ProposalState'
import { Checklist } from './Checklist'

export interface ProposalProps {
  id: ProposalId
  scheduleCode: ScheduleCode
  projectId: string
  acq_mode_id: number
  state: ProposalState
  proposalTitle: string
  description: string
  proposedBy: string
  proposedByRole: string
  areaOffice: string
  collieryCode: string
  adjacentCollieries: string[]
  totalArea: Area
  notificationDate: Date | null
  checklist: Checklist
  plotIds: string[]
  proposalType?: string
  rateTenancyWithEmp?: number
  rateTenancyNoEmp?: number
  rateGovtLand?: number
  rateForestLand?: number
  employmentProposedCount?: number
  employmentSystem?: string
  hasDebottarLand?: boolean
  hasTribalLand?: boolean
  hasDisputedLand?: boolean
  hasFormalNegotiation?: boolean
  requiresBoardApproval?: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateProposalProps {
  projectId: string
  acq_mode_id: number
  proposalTitle: string
  description?: string
  proposedBy: string
  proposedByRole: string
  areaOffice?: string
  collieryCode: string
  adjacentCollieries?: string[]
  notificationDate?: Date
  proposalNo?: string
  proposalType?: string
  rateTenancyWithEmp?: number
  rateTenancyNoEmp?: number
  rateGovtLand?: number
  rateForestLand?: number
  employmentProposedCount?: number
  employmentSystem?: string
  hasDebottarLand?: boolean
  hasTribalLand?: boolean
  hasDisputedLand?: boolean
  hasFormalNegotiation?: boolean
  requiresBoardApproval?: boolean
}

export interface UpdateProposalProps {
  proposalTitle?: string
  description?: string
  areaOffice?: string
  adjacentCollieries?: string[]
  notificationDate?: Date
}

export class ProposalNotEditableException extends DomainException {
  constructor(proposalId: string, currentState: string) {
    super(
      `Proposal '${proposalId}' cannot be edited in state '${currentState}'`,
      'PROPOSAL_NOT_EDITABLE'
    )
  }
}

export class ProposalNotSubmittableException extends DomainException {
  constructor(proposalId: string, reason: string) {
    super(
      `Proposal '${proposalId}' cannot be submitted: ${reason}`,
      'PROPOSAL_NOT_SUBMITTABLE'
    )
  }
}

export class InvalidProposalTransitionException extends DomainException {
  constructor(from: string, to: string) {
    super(
      `Invalid state transition from '${from}' to '${to}'`,
      'INVALID_PROPOSAL_TRANSITION'
    )
  }
}

export class ChecklistItemNotFoundException extends DomainException {
  constructor(itemKey: string) {
    super(`Checklist item '${itemKey}' not found`, 'CHECKLIST_ITEM_NOT_FOUND')
  }
}

export class DuplicatePlotException extends DomainException {
  constructor(plotId: string) {
    super(`Plot '${plotId}' already exists in proposal`, 'DUPLICATE_PLOT')
  }
}

export class Proposal extends AggregateRoot<string> {
  private _scheduleCode: ScheduleCode
  private _projectId: string
  private _acq_mode_id: number
  private _state: ProposalState
  private _proposalTitle: string
  private _description: string
  private _proposedBy: string
  private _proposedByRole: string
  private _areaOffice: string
  private _collieryCode: string
  private _adjacentCollieries: string[]
  private _totalArea: Area
  private _notificationDate: Date | null
  private _checklist: Checklist
  private _plotIds: string[]
  private _proposalType: string
  private _rateTenancyWithEmp: number
  private _rateTenancyNoEmp: number
  private _rateGovtLand: number
  private _rateForestLand: number
  private _employmentProposedCount: number
  private _employmentSystem: string
  private _hasDebottarLand: boolean
  private _hasTribalLand: boolean
  private _hasDisputedLand: boolean
  private _hasFormalNegotiation: boolean
  private _requiresBoardApproval: boolean
  private _createdAt: Date
  private _updatedAt: Date

  private constructor(props: ProposalProps) {
    super(props.id.value)
    this._scheduleCode = props.scheduleCode
    this._projectId = props.projectId
    this._acq_mode_id = props.acq_mode_id
    this._state = props.state
    this._proposalTitle = props.proposalTitle
    this._description = props.description
    this._proposedBy = props.proposedBy
    this._proposedByRole = props.proposedByRole
    this._areaOffice = props.areaOffice
    this._collieryCode = props.collieryCode
    this._adjacentCollieries = props.adjacentCollieries
    this._totalArea = props.totalArea
    this._notificationDate = props.notificationDate
    this._checklist = props.checklist
    this._plotIds = props.plotIds
    this._proposalType = props.proposalType ?? 'STANDARD_LAP'
    this._rateTenancyWithEmp = props.rateTenancyWithEmp ?? 0
    this._rateTenancyNoEmp = props.rateTenancyNoEmp ?? 0
    this._rateGovtLand = props.rateGovtLand ?? 0
    this._rateForestLand = props.rateForestLand ?? 0
    this._employmentProposedCount = props.employmentProposedCount ?? 0
    this._employmentSystem = props.employmentSystem ?? 'PACKAGE_DEAL'
    this._hasDebottarLand = props.hasDebottarLand ?? false
    this._hasTribalLand = props.hasTribalLand ?? false
    this._hasDisputedLand = props.hasDisputedLand ?? false
    this._hasFormalNegotiation = props.hasFormalNegotiation ?? false
    this._requiresBoardApproval = props.requiresBoardApproval ?? true
    this._createdAt = props.createdAt
    this._updatedAt = props.updatedAt
  }

  // Factory method for creating new proposals
  static create(props: CreateProposalProps, id?: string): Result<Proposal> {
    const errors: Array<{ field: string; message: string }> = []

    // Validate title
    if (!props.proposalTitle || props.proposalTitle.trim().length === 0) {
      errors.push({ field: 'proposalTitle', message: 'Proposal title is required' })
    } else if (props.proposalTitle.length > 500) {
      errors.push({ field: 'proposalTitle', message: 'Title must be less than 500 characters' })
    }

    // Validate acquisition mode
    if (!props.acq_mode_id || props.acq_mode_id <= 0) {
      errors.push({ field: 'acq_mode_id', message: 'Valid acquisition mode ID is required' })
    }

    // Validate project ID
    if (!props.projectId || props.projectId.trim().length === 0) {
      errors.push({ field: 'projectId', message: 'Project ID is required' })
    }

    // Validate colliery code
    if (!props.collieryCode || props.collieryCode.trim().length === 0) {
      errors.push({ field: 'collieryCode', message: 'Colliery code is required' })
    }

    if (errors.length > 0) {
      return Fail(`'Validation failed', errors`)
    }

    const proposalId = id ? ProposalId.fromString(id) : ProposalId.create()
    const scheduleCode = props.proposalNo ? ScheduleCode.fromString(props.proposalNo) : ScheduleCode.generate()
    const acq_mode_id = props.acq_mode_id
    const now = new Date()

    const proposal = new Proposal({
      id: proposalId,
      scheduleCode,
      projectId: props.projectId,
      acq_mode_id,
      state: ProposalState.DRAFTING,
      proposalTitle: props.proposalTitle.trim(),
      description: props.description?.trim() ?? '',
      proposedBy: props.proposedBy,
      proposedByRole: props.proposedByRole,
      areaOffice: props.areaOffice?.trim() ?? '',
      collieryCode: props.collieryCode.trim(),
      adjacentCollieries: props.adjacentCollieries || [],
      totalArea: Area.zero('ACRES'),
      notificationDate: props.notificationDate ?? null,
      checklist: Checklist.createForMode(acq_mode_id),
      plotIds: [],
      proposalType: props.proposalType ?? 'STANDARD_LAP',
      rateTenancyWithEmp: props.rateTenancyWithEmp ?? 0,
      rateTenancyNoEmp: props.rateTenancyNoEmp ?? 0,
      rateGovtLand: props.rateGovtLand ?? 0,
      rateForestLand: props.rateForestLand ?? 0,
      employmentProposedCount: props.employmentProposedCount ?? 0,
      employmentSystem: props.employmentSystem ?? 'PACKAGE_DEAL',
      hasDebottarLand: props.hasDebottarLand ?? false,
      hasTribalLand: props.hasTribalLand ?? false,
      hasDisputedLand: props.hasDisputedLand ?? false,
      hasFormalNegotiation: props.hasFormalNegotiation ?? false,
      requiresBoardApproval: props.requiresBoardApproval ?? true,
      createdAt: now,
      updatedAt: now,
    })

    proposal.addDomainEvent(createDomainEvent('PROPOSAL_CREATED', proposal.id, {
      scheduleCode: scheduleCode.value,
      proposalTitle: props.proposalTitle,
      acq_mode_id: acq_mode_id,
      proposedBy: props.proposedBy,
    }))

    return { isSuccess: true, isFailure: false, value: proposal, error: null }
  }

  // Reconstitute from persistence
  static reconstitute(data: {
    id: string
    scheduleCode: string
    projectId: string
    acq_mode_id: number
    state: string
    proposalTitle: string
    description: string
    proposedBy: string
    proposedByRole: string
    areaOffice: string
    collieryCode: string
    adjacentCollieries: string[]
    totalAreaAcres: string
    notificationDate: Date | null
    modeSpecificChecklist: string
    proposalType?: string
    rateTenancyWithEmp?: number
    rateTenancyNoEmp?: number
    rateGovtLand?: number
    rateForestLand?: number
    employmentProposedCount?: number
    employmentSystem?: string
    hasDebottarLand?: boolean
    hasTribalLand?: boolean
    hasDisputedLand?: boolean
    hasFormalNegotiation?: boolean
    requiresBoardApproval?: boolean
    plotIds: string[]
    createdAt: Date
    updatedAt: Date
  }): Proposal {
    return new Proposal({
      id: ProposalId.fromString(data.id),
      scheduleCode: ScheduleCode.fromString(data.scheduleCode),
      projectId: data.projectId,
      acq_mode_id: data.acq_mode_id,
      state: ProposalState.fromString(data.state),
      proposalTitle: data.proposalTitle,
      description: data.description,
      proposedBy: data.proposedBy,
      proposedByRole: data.proposedByRole,
      areaOffice: data.areaOffice,
      collieryCode: data.collieryCode,
      adjacentCollieries: data.adjacentCollieries,
      totalArea: Area.fromAcres(data.totalAreaAcres),
      notificationDate: data.notificationDate,
      checklist: Checklist.fromJSON(data.modeSpecificChecklist),
      proposalType: data.proposalType,
      rateTenancyWithEmp: data.rateTenancyWithEmp,
      rateTenancyNoEmp: data.rateTenancyNoEmp,
      rateGovtLand: data.rateGovtLand,
      rateForestLand: data.rateForestLand,
      employmentProposedCount: data.employmentProposedCount,
      employmentSystem: data.employmentSystem,
      hasDebottarLand: data.hasDebottarLand,
      hasTribalLand: data.hasTribalLand,
      hasDisputedLand: data.hasDisputedLand,
      hasFormalNegotiation: data.hasFormalNegotiation,
      requiresBoardApproval: data.requiresBoardApproval,
      plotIds: data.plotIds,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    })
  }

  // Business behaviors
  update(props: UpdateProposalProps): Result<void> {
    if (!this._state.canBeEdited()) {
      return Fail('Invalid state')
    }

    const errors: Array<{ field: string; message: string }> = []

    if (props.proposalTitle !== undefined) {
      if (!props.proposalTitle || props.proposalTitle.trim().length === 0) {
        errors.push({ field: 'proposalTitle', message: 'Proposal title is required' })
      } else if (props.proposalTitle.length > 500) {
        errors.push({ field: 'proposalTitle', message: 'Title must be less than 500 characters' })
      } else {
        this._proposalTitle = props.proposalTitle.trim()
      }
    }

    if (props.description !== undefined) {
      this._description = props.description.trim()
    }

    if (props.areaOffice !== undefined) {
      this._areaOffice = props.areaOffice.trim()
    }

    if (props.adjacentCollieries !== undefined) {
      this._adjacentCollieries = props.adjacentCollieries
    }

    if (props.notificationDate !== undefined) {
      this._notificationDate = props.notificationDate
    }

    if (errors.length > 0) {
      return Fail(`'Validation failed', errors`)
    }

    this._updatedAt = new Date()
    return { isSuccess: true, isFailure: false, value: undefined, error: null }
  }

  transitionTo(newState: ProposalState, actorId?: string, comments?: string): Result<void> {
    const previousState = this._state
    this._state = newState
    this._updatedAt = new Date()

    this.addDomainEvent(createDomainEvent('PROPOSAL_STATE_TRANSITIONED', this.id, {
      scheduleCode: this._scheduleCode.value,
      previousState: previousState.value,
      newState: newState.value,
      actorId: actorId ?? 'system',
      comments: comments ?? '',
    }))

    // Detect return to Unit (Gap 2.3)
    if (newState.value === 'UnitSubmitted' && previousState.value === 'CrossCollieryVerification') {
      this.addDomainEvent(createDomainEvent('PROPOSAL_RETURNED', this.id, {
        scheduleCode: this._scheduleCode.value,
        previousState: previousState.value,
        newState: newState.value,
        actorId: actorId ?? 'system',
        reason: comments ?? 'Returned for plot correction',
      }))
    }

    return { isSuccess: true, isFailure: false, value: undefined, error: null }
  }

  submit(isLimitBreached: boolean = false): Result<void> {
    if (!this._state.canBeSubmitted()) {
      return Fail('Cannot submit from state')
    }

    if (!this._checklist.areAllRequiredItemsComplete()) {
      return Fail('All required checklist items must be complete')
    }

    if (isLimitBreached) {
      this._state = ProposalState.LIMIT_BREACHED
      this._updatedAt = new Date()
      this.addDomainEvent(createDomainEvent('PROPOSAL_LIMIT_BREACHED', this.id, {
        scheduleCode: this._scheduleCode.value,
        totalAreaAcres: this._totalArea.toDecimal().toString(),
      }))
    } else {
      this._state = ProposalState.AREA_VETTING
      this._updatedAt = new Date()
      this.addDomainEvent(createDomainEvent('PROPOSAL_SUBMITTED', this.id, {
        scheduleCode: this._scheduleCode.value,
        proposalTitle: this._proposalTitle,
      }))
    }

    return { isSuccess: true, isFailure: false, value: undefined, error: null }
  }

  approveBoardDeviation(approvedBy: string): Result<void> {
    if (!this._state.isLimitBreached()) {
      return Fail('Proposal is not in LIMIT_BREACHED state');
    }

    this._state = ProposalState.BOARD_APPROVED;
    // Automatically transition to AREA_VETTING to continue standard flow
    this._state = ProposalState.AREA_VETTING;
    this._updatedAt = new Date();

    this.addDomainEvent(createDomainEvent('PROPOSAL_BOARD_APPROVED', this.id, {
      scheduleCode: this._scheduleCode.value,
      approvedBy,
    }))

    return { isSuccess: true, isFailure: false, value: undefined, error: null }
  }

  approve(approvedBy: string): Result<void> {
    if (!this._state.canBeApproved()) {
      return Fail('Already approved')
    }

    this._state = ProposalState.APPROVED
    this._updatedAt = new Date()

    this.addDomainEvent(createDomainEvent('PROPOSAL_APPROVED', this.id, {
      scheduleCode: this._scheduleCode.value,
      approvedBy,
    }))

    return { isSuccess: true, isFailure: false, value: undefined, error: null }
  }

  reject(rejectedBy: string, reason: string): Result<void> {
    if (!this._state.canBeRejected()) {
      return Fail('Already rejected')
    }

    const previousState = this._state
    this._state = previousState.isApproved() ? ProposalState.REJECTED : ProposalState.DRAFTING
    this._updatedAt = new Date()

    this.addDomainEvent(createDomainEvent('PROPOSAL_REJECTED', this.id, {
      scheduleCode: this._scheduleCode.value,
      rejectedBy,
      reason,
      previousState: previousState.value,
    }))

    return { isSuccess: true, isFailure: false, value: undefined, error: null }
  }

  cancel(): Result<void> {
    if (!this._state.canBeCancelled()) {
      return Fail(`this._state.value, 'Cancelled'`)
    }

    this._state = ProposalState.CANCELLED
    this._updatedAt = new Date()

    this.addDomainEvent(createDomainEvent('PROPOSAL_CANCELLED', this.id, {
      scheduleCode: this._scheduleCode.value,
    }))

    return { isSuccess: true, isFailure: false, value: undefined, error: null }
  }

  updateChecklistItem(
    itemKey: string,
    status: 'pending' | 'in_progress' | 'complete' | 'not_applicable'
  ): Result<void> {
    if (!this._state.canUpdateChecklist()) {
      return Fail('Invalid state')
    }

    const item = this._checklist.getItem(itemKey)
    if (!item) {
      return Fail(`itemKey`)
    }

    this._checklist = this._checklist.updateItemStatus(itemKey, status)
    this._updatedAt = new Date()

    return { isSuccess: true, isFailure: false, value: undefined, error: null }
  }

  addPlot(plotId: string, plotArea: Area): Result<void> {
    if (!this._state.canAddPlots()) {
      return Fail('Invalid state')
    }

    if (!this._plotIds.includes(plotId)) {
      this._plotIds.push(plotId)
      this._totalArea = this._totalArea.add(plotArea)
      this._updatedAt = new Date()
    }

    return { isSuccess: true, isFailure: false, value: undefined, error: null }
  }

  removePlot(plotId: string, plotArea: Area): Result<void> {
    if (!this._state.canRemovePlots()) {
      return Fail('Invalid state')
    }

    const index = this._plotIds.indexOf(plotId)
    if (index > -1) {
      this._plotIds.splice(index, 1)
      this._totalArea = this._totalArea.subtract(plotArea)
      this._updatedAt = new Date()
    }

    return { isSuccess: true, isFailure: false, value: undefined, error: null }
  }

  // Business rules / invariants
  canBeEdited(): boolean {
    return this._state.canBeEdited()
  }

  canBeSubmitted(): boolean {
    return this._state.canBeSubmitted() && this._checklist.areAllRequiredItemsComplete()
  }

  canBeApproved(): boolean {
    return this._state.canBeApproved()
  }

  canAddPlots(): boolean {
    return this._state.canAddPlots()
  }

  canRemovePlots(): boolean {
    return this._state.canRemovePlots()
  }

  hasPlot(plotId: string): boolean {
    return this._plotIds.includes(plotId)
  }

  getPlotCount(): number {
    return this._plotIds.length
  }

  // Getters
  get proposalId(): ProposalId {
    return ProposalId.fromString(this.id)
  }

  get scheduleCode(): ScheduleCode {
    return this._scheduleCode
  }

  get projectId(): string {
    return this._projectId
  }

  get acq_mode_id(): number {
    return this._acq_mode_id
  }

  get state(): ProposalState {
    return this._state
  }

  get proposalTitle(): string {
    return this._proposalTitle
  }

  get description(): string {
    return this._description
  }

  get proposedBy(): string {
    return this._proposedBy
  }

  get proposedByRole(): string {
    return this._proposedByRole
  }

  get areaOffice(): string {
    return this._areaOffice
  }

  get collieryCode(): string {
    return this._collieryCode
  }

  get adjacentCollieries(): string[] {
    return this._adjacentCollieries
  }

  get totalArea(): Area {
    return this._totalArea
  }

  get notificationDate(): Date | null {
    return this._notificationDate
  }

  get checklist(): Checklist {
    return this._checklist
  }

  get plotIds(): ReadonlyArray<string> {
    return this._plotIds
  }

  get hasDebottarLand(): boolean {
    return this._hasDebottarLand
  }

  get hasTribalLand(): boolean {
    return this._hasTribalLand
  }

  get hasDisputedLand(): boolean {
    return this._hasDisputedLand
  }

  get hasFormalNegotiation(): boolean {
    return this._hasFormalNegotiation
  }

  get requiresBoardApproval(): boolean {
    return this._requiresBoardApproval
  }

  get createdAt(): Date {
    return this._createdAt
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  // Serialization for persistence
  toPersistence(): {
    id: string
    scheduleCode: string
    projectId: string
    acq_mode_id: number
    state: string
    proposalTitle: string
    description: string
    proposedBy: string
    proposedByRole: string
    areaOffice: string
    collieryCode: string
    adjacentCollieries: string[]
    totalAreaAcres: string
    notificationDate: Date | null
    modeSpecificChecklist: string
    proposalType?: string
    rateTenancyWithEmp?: number
    rateTenancyNoEmp?: number
    rateGovtLand?: number
    rateForestLand?: number
    employmentProposedCount?: number
    employmentSystem?: string
    hasDebottarLand?: boolean
    hasTribalLand?: boolean
    hasDisputedLand?: boolean
    hasFormalNegotiation?: boolean
    requiresBoardApproval?: boolean
    createdAt: Date
    updatedAt: Date
  } {
    return {
      id: this.id,
      scheduleCode: this._scheduleCode.value,
      projectId: this._projectId,
      acq_mode_id: this._acq_mode_id,
      state: this._state.value,
      proposalTitle: this._proposalTitle,
      description: this._description,
      proposedBy: this._proposedBy,
      proposedByRole: this._proposedByRole,
      areaOffice: this._areaOffice,
      collieryCode: this._collieryCode,
      adjacentCollieries: this._adjacentCollieries,
      notificationDate: this._notificationDate,
      modeSpecificChecklist: this._checklist.toJSON(),
      proposalType: this._proposalType,
      rateTenancyWithEmp: this._rateTenancyWithEmp,
      rateTenancyNoEmp: this._rateTenancyNoEmp,
      rateGovtLand: this._rateGovtLand,
      rateForestLand: this._rateForestLand,
      employmentProposedCount: this._employmentProposedCount,
      employmentSystem: this._employmentSystem,
      hasDebottarLand: this._hasDebottarLand,
      hasTribalLand: this._hasTribalLand,
      hasDisputedLand: this._hasDisputedLand,
      hasFormalNegotiation: this._hasFormalNegotiation,
      requiresBoardApproval: this._requiresBoardApproval,
      totalAreaAcres: this._totalArea.value.toString(),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    }
  }
}
