/**
 * Proposal Aggregate Root - Core domain entity for land acquisition proposals.
 * Encapsulates all business rules and invariants for proposal/schedule management.
 */
import { AggregateRoot } from '@/core/base/AggregateRoot'
import { Result, Fail } from '@/core/result/Result'
import { ValidationException, DomainException } from '@/core/errors'
import { createDomainEvent } from '@/core/base/DomainEvent'
import { Area } from '@/domain/value-objects/Area'
import { ProposalId } from './ProposalId'
import { ScheduleCode } from './ScheduleCode'
import { AcquisitionMode } from './AcquisitionMode'
import { ProposalState } from './ProposalState'
import { Checklist } from './Checklist'

export interface ProposalProps {
  id: ProposalId
  scheduleCode: ScheduleCode
  projectId: string
  acquisitionMode: AcquisitionMode
  state: ProposalState
  proposalTitle: string
  description: string
  proposedBy: string
  proposedByRole: string
  areaOffice: string
  collieryCode: string
  adjacentColliery: string
  totalArea: Area
  notificationDate: Date | null
  checklist: Checklist
  plotIds: string[]
  createdAt: Date
  updatedAt: Date
}

export interface CreateProposalProps {
  projectId: string
  acquisitionMode: string
  proposalTitle: string
  description?: string
  proposedBy: string
  proposedByRole: string
  areaOffice?: string
  collieryCode: string
  adjacentColliery?: string
  notificationDate?: Date
}

export interface UpdateProposalProps {
  proposalTitle?: string
  description?: string
  areaOffice?: string
  adjacentColliery?: string
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

export class Proposal extends AggregateRoot<string> {
  private _scheduleCode: ScheduleCode
  private _projectId: string
  private _acquisitionMode: AcquisitionMode
  private _state: ProposalState
  private _proposalTitle: string
  private _description: string
  private _proposedBy: string
  private _proposedByRole: string
  private _areaOffice: string
  private _collieryCode: string
  private _adjacentColliery: string
  private _totalArea: Area
  private _notificationDate: Date | null
  private _checklist: Checklist
  private _plotIds: string[]
  private _createdAt: Date
  private _updatedAt: Date

  private constructor(props: ProposalProps) {
    super(props.id.value)
    this._scheduleCode = props.scheduleCode
    this._projectId = props.projectId
    this._acquisitionMode = props.acquisitionMode
    this._state = props.state
    this._proposalTitle = props.proposalTitle
    this._description = props.description
    this._proposedBy = props.proposedBy
    this._proposedByRole = props.proposedByRole
    this._areaOffice = props.areaOffice
    this._collieryCode = props.collieryCode
    this._adjacentColliery = props.adjacentColliery
    this._totalArea = props.totalArea
    this._notificationDate = props.notificationDate
    this._checklist = props.checklist
    this._plotIds = props.plotIds
    this._createdAt = props.createdAt
    this._updatedAt = props.updatedAt
  }

  // Factory method for creating new proposals
  static create(props: CreateProposalProps, id?: string): Result<Proposal, ValidationException> {
    const errors: Array<{ field: string; message: string }> = []

    // Validate title
    if (!props.proposalTitle || props.proposalTitle.trim().length === 0) {
      errors.push({ field: 'proposalTitle', message: 'Proposal title is required' })
    } else if (props.proposalTitle.length > 500) {
      errors.push({ field: 'proposalTitle', message: 'Title must be less than 500 characters' })
    }

    // Validate acquisition mode
    const modeResult = AcquisitionMode.tryCreate(props.acquisitionMode)
    if (modeResult.isFailure) {
      errors.push({ field: 'acquisitionMode', message: modeResult.error!.message })
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
      return Fail(new ValidationException('Validation failed', errors))
    }

    const proposalId = id ? ProposalId.fromString(id) : ProposalId.create()
    const scheduleCode = ScheduleCode.generate()
    const acquisitionMode = (modeResult as any).value as AcquisitionMode
    const now = new Date()

    const proposal = new Proposal({
      id: proposalId,
      scheduleCode,
      projectId: props.projectId,
      acquisitionMode,
      state: ProposalState.DRAFTING,
      proposalTitle: props.proposalTitle.trim(),
      description: props.description?.trim() ?? '',
      proposedBy: props.proposedBy,
      proposedByRole: props.proposedByRole,
      areaOffice: props.areaOffice?.trim() ?? '',
      collieryCode: props.collieryCode.trim(),
      adjacentColliery: props.adjacentColliery?.trim() ?? '',
      totalArea: Area.zero('ACRES'),
      notificationDate: props.notificationDate ?? null,
      checklist: Checklist.createForMode(acquisitionMode),
      plotIds: [],
      createdAt: now,
      updatedAt: now,
    })

    proposal.addDomainEvent(createDomainEvent('PROPOSAL_CREATED', proposal.id, {
      scheduleCode: scheduleCode.value,
      proposalTitle: props.proposalTitle,
      acquisitionMode: acquisitionMode.value,
      proposedBy: props.proposedBy,
    }))

    return { isSuccess: true, isFailure: false, value: proposal, error: null }
  }

  // Reconstitute from persistence
  static reconstitute(data: {
    id: string
    scheduleCode: string
    projectId: string
    acquisitionMode: string
    state: string
    proposalTitle: string
    description: string
    proposedBy: string
    proposedByRole: string
    areaOffice: string
    collieryCode: string
    adjacentColliery: string
    totalAreaAcres: string
    notificationDate: Date | null
    modeSpecificChecklist: string
    plotIds: string[]
    createdAt: Date
    updatedAt: Date
  }): Proposal {
    return new Proposal({
      id: ProposalId.fromString(data.id),
      scheduleCode: ScheduleCode.fromString(data.scheduleCode),
      projectId: data.projectId,
      acquisitionMode: AcquisitionMode.fromString(data.acquisitionMode),
      state: ProposalState.fromString(data.state),
      proposalTitle: data.proposalTitle,
      description: data.description,
      proposedBy: data.proposedBy,
      proposedByRole: data.proposedByRole,
      areaOffice: data.areaOffice,
      collieryCode: data.collieryCode,
      adjacentColliery: data.adjacentColliery,
      totalArea: Area.fromAcres(data.totalAreaAcres),
      notificationDate: data.notificationDate,
      checklist: Checklist.fromJSON(data.modeSpecificChecklist),
      plotIds: data.plotIds,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    })
  }

  // Business behaviors
  update(props: UpdateProposalProps): Result<void, ProposalNotEditableException | ValidationException> {
    if (!this._state.canBeEdited()) {
      return Fail(new ProposalNotEditableException(this.id, this._state.value))
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

    if (props.adjacentColliery !== undefined) {
      this._adjacentColliery = props.adjacentColliery.trim()
    }

    if (props.notificationDate !== undefined) {
      this._notificationDate = props.notificationDate
    }

    if (errors.length > 0) {
      return Fail(new ValidationException('Validation failed', errors))
    }

    this._updatedAt = new Date()
    return { isSuccess: true, isFailure: false, value: undefined, error: null }
  }

  submit(): Result<void, ProposalNotSubmittableException> {
    if (!this._state.canBeSubmitted()) {
      return Fail(new ProposalNotSubmittableException(this.id, `Cannot submit from state ${this._state.value}`))
    }

    if (!this._checklist.areAllRequiredItemsComplete()) {
      return Fail(new ProposalNotSubmittableException(this.id, 'All required checklist items must be complete'))
    }

    this._state = ProposalState.AREA_VETTING
    this._updatedAt = new Date()

    this.addDomainEvent(createDomainEvent('PROPOSAL_SUBMITTED', this.id, {
      scheduleCode: this._scheduleCode.value,
      proposalTitle: this._proposalTitle,
    }))

    return { isSuccess: true, isFailure: false, value: undefined, error: null }
  }

  approve(approvedBy: string): Result<void, InvalidProposalTransitionException> {
    if (!this._state.canBeApproved()) {
      return Fail(new InvalidProposalTransitionException(this._state.value, 'Approved'))
    }

    this._state = ProposalState.APPROVED
    this._updatedAt = new Date()

    this.addDomainEvent(createDomainEvent('PROPOSAL_APPROVED', this.id, {
      scheduleCode: this._scheduleCode.value,
      approvedBy,
    }))

    return { isSuccess: true, isFailure: false, value: undefined, error: null }
  }

  reject(rejectedBy: string, reason: string): Result<void, InvalidProposalTransitionException> {
    if (!this._state.canBeRejected()) {
      return Fail(new InvalidProposalTransitionException(this._state.value, 'Rejected'))
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

  cancel(): Result<void, InvalidProposalTransitionException> {
    if (!this._state.canBeCancelled()) {
      return Fail(new InvalidProposalTransitionException(this._state.value, 'Cancelled'))
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
  ): Result<void, ProposalNotEditableException | ChecklistItemNotFoundException> {
    if (!this._state.canUpdateChecklist()) {
      return Fail(new ProposalNotEditableException(this.id, this._state.value))
    }

    const item = this._checklist.getItem(itemKey)
    if (!item) {
      return Fail(new ChecklistItemNotFoundException(itemKey))
    }

    this._checklist = this._checklist.updateItemStatus(itemKey, status)
    this._updatedAt = new Date()

    return { isSuccess: true, isFailure: false, value: undefined, error: null }
  }

  addPlot(plotId: string, plotArea: Area): Result<void, ProposalNotEditableException> {
    if (!this._state.canAddPlots()) {
      return Fail(new ProposalNotEditableException(this.id, this._state.value))
    }

    if (!this._plotIds.includes(plotId)) {
      this._plotIds.push(plotId)
      this._totalArea = this._totalArea.add(plotArea)
      this._updatedAt = new Date()
    }

    return { isSuccess: true, isFailure: false, value: undefined, error: null }
  }

  removePlot(plotId: string, plotArea: Area): Result<void, ProposalNotEditableException> {
    if (!this._state.canRemovePlots()) {
      return Fail(new ProposalNotEditableException(this.id, this._state.value))
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

  get acquisitionMode(): AcquisitionMode {
    return this._acquisitionMode
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

  get adjacentColliery(): string {
    return this._adjacentColliery
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
    acquisitionMode: string
    state: string
    proposalTitle: string
    description: string
    proposedBy: string
    proposedByRole: string
    areaOffice: string
    collieryCode: string
    adjacentColliery: string
    totalAreaAcres: string
    notificationDate: Date | null
    modeSpecificChecklist: string
    createdAt: Date
    updatedAt: Date
  } {
    return {
      id: this.id,
      scheduleCode: this._scheduleCode.value,
      projectId: this._projectId,
      acquisitionMode: this._acquisitionMode.value,
      state: this._state.value,
      proposalTitle: this._proposalTitle,
      description: this._description,
      proposedBy: this._proposedBy,
      proposedByRole: this._proposedByRole,
      areaOffice: this._areaOffice,
      collieryCode: this._collieryCode,
      adjacentColliery: this._adjacentColliery,
      totalAreaAcres: this._totalArea.toDecimal().toString(),
      notificationDate: this._notificationDate,
      modeSpecificChecklist: this._checklist.toJSON(),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    }
  }
}
