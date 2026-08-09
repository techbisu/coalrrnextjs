/**
 * ProposalState Value Object - State machine for proposal workflow.
 * Aligned to mirror DB current_stage_cd & WorkflowEngine (Single Source of Truth).
 */
import { ValueObject } from '@/core/base/ValueObject'
import { Result, Fail } from '@/core/result/Result'
import { ValidationException } from '@/core/errors'
import { COMPENSATION_PAYROLL_STATES } from '@/core/workflow/states'
import type { WorkflowState } from '@/core/workflow/types'

export type ProposalStateType =
  | 'Drafting'
  | 'UnitSubmitted'
  | 'CrossCollieryVerification'
  | 'AreaVetting'
  | 'HqParallelVetting'
  | 'HqVetting'
  | 'GmLreReview'
  | 'BoardEscalation'
  | 'LimitBreached'
  | 'BoardApproved'
  | 'DocketIssued'
  | 'ManuallyApproved'
  | 'Published'
  | 'Approved'
  | 'Rejected'
  | 'Cancelled'
  | 'Closed'

export class ProposalState extends ValueObject<ProposalStateType> {
  private constructor(value: ProposalStateType) {
    super(value)
  }

  static DRAFTING = new ProposalState('Drafting')
  static UNIT_SUBMITTED = new ProposalState('UnitSubmitted')
  static CROSS_COLLIERY_VERIFICATION = new ProposalState('CrossCollieryVerification')
  static AREA_VETTING = new ProposalState('AreaVetting')
  static HQ_PARALLEL_VETTING = new ProposalState('HqParallelVetting')
  static HQ_VETTING = new ProposalState('HqVetting')
  static GM_LRE_REVIEW = new ProposalState('GmLreReview')
  static BOARD_ESCALATION = new ProposalState('BoardEscalation')
  static LIMIT_BREACHED = new ProposalState('LimitBreached')
  static BOARD_APPROVED = new ProposalState('BoardApproved')
  static DOCKET_ISSUED = new ProposalState('DocketIssued')
  static MANUALLY_APPROVED = new ProposalState('ManuallyApproved')
  static PUBLISHED = new ProposalState('Published')
  static APPROVED = new ProposalState('Approved')
  static REJECTED = new ProposalState('Rejected')
  static CANCELLED = new ProposalState('Cancelled')
  static CLOSED = new ProposalState('Closed')

  private static normalizeStateString(value: string): ProposalStateType {
    if (!value) return 'Drafting'
    const val = value.trim()
    
    // Normalize legacy state names
    if (val === 'DRAFT' || val === 'DOCKET_PREP') return 'Drafting'
    if (val === 'SUBMITTED') return 'UnitSubmitted'
    if (val === 'AREA_VETTING') return 'AreaVetting'
    if (val === 'HQ_VETTING') return 'HqVetting'
    if (val === 'HQ_PARALLEL_VETTING') return 'HqParallelVetting'
    if (val === 'GM_LRE_REVIEW') return 'GmLreReview'
    if (val === 'LIMIT_BREACHED') return 'LimitBreached'
    if (val === 'BOARD_APPROVED') return 'BoardApproved'
    if (val === 'BOARD_ESCALATION') return 'BoardEscalation'
    if (val === 'DOCKET_ISSUED') return 'DocketIssued'
    if (val === 'MANUALLY_APPROVED') return 'ManuallyApproved'
    if (val === 'PUBLISHED') return 'Published'
    if (val === 'APPROVED') return 'Approved'
    if (val === 'REJECTED') return 'Rejected'
    if (val === 'CANCELLED') return 'Cancelled'
    if (val === 'CLOSED') return 'Closed'

    return val as ProposalStateType
  }

  static tryCreate(value: string): Result<ProposalState, ValidationException> {
    const normalized = ProposalState.normalizeStateString(value)
    const validStates: ProposalStateType[] = [
      'Drafting',
      'UnitSubmitted',
      'CrossCollieryVerification',
      'AreaVetting',
      'HqParallelVetting',
      'HqVetting',
      'GmLreReview',
      'BoardEscalation',
      'LimitBreached',
      'BoardApproved',
      'DocketIssued',
      'ManuallyApproved',
      'Published',
      'Approved',
      'Rejected',
      'Cancelled',
      'Closed'
    ]
    
    if (!validStates.includes(normalized)) {
      return Fail(new ValidationException('Invalid Proposal State', [
        { field: 'state', message: `Must be one of: ${validStates.join(', ')}` }
      ]))
    }

    return { isSuccess: true, isFailure: false, value: new ProposalState(normalized), error: null }
  }

  static fromString(value: string): ProposalState {
    const normalized = ProposalState.normalizeStateString(value)
    return new ProposalState(normalized)
  }

  get value(): ProposalStateType {
    return this._value
  }

  // State checks
  isDrafting(): boolean { return this._value === 'Drafting' }
  isUnitSubmitted(): boolean { return this._value === 'UnitSubmitted' }
  isCrossCollieryVerification(): boolean { return this._value === 'CrossCollieryVerification' }
  isAreaVetting(): boolean { return this._value === 'AreaVetting' }
  isHqParallelVetting(): boolean { return this._value === 'HqParallelVetting' }
  isHqVetting(): boolean { return this._value === 'HqVetting' }
  isGmLreReview(): boolean { return this._value === 'GmLreReview' }
  isBoardEscalation(): boolean { return this._value === 'BoardEscalation' }
  isLimitBreached(): boolean { return this._value === 'LimitBreached' }
  isBoardApproved(): boolean { return this._value === 'BoardApproved' }
  isDocketIssued(): boolean { return this._value === 'DocketIssued' }
  isManuallyApproved(): boolean { return this._value === 'ManuallyApproved' }
  isPublished(): boolean { return this._value === 'Published' }
  isApproved(): boolean { return this._value === 'Approved' }
  isRejected(): boolean { return this._value === 'Rejected' }
  isCancelled(): boolean { return this._value === 'Cancelled' }
  isClosed(): boolean { return this._value === 'Closed' }

  // Business rules
  canBeEdited(): boolean {
    return this._value === 'Drafting' || this._value === 'CrossCollieryVerification' || this._value === 'UnitSubmitted'
  }

  canBeSubmitted(): boolean {
    return this._value === 'Drafting'
  }

  canBeApproved(): boolean {
    return this._value === 'AreaVetting' || this._value === 'HqVetting' || this._value === 'HqParallelVetting' || this._value === 'GmLreReview' || this._value === 'ManuallyApproved'
  }

  canBeRejected(): boolean {
    return this._value === 'AreaVetting' || this._value === 'HqVetting' || this._value === 'HqParallelVetting' || this._value === 'GmLreReview' || this._value === 'Approved'
  }

  canBeCancelled(): boolean {
    return !this.isPublished() && !this.isApproved() && !this.isClosed() && !this.isCancelled()
  }

  canAddPlots(): boolean {
    return this._value === 'Drafting' || this._value === 'UnitSubmitted'
  }

  canRemovePlots(): boolean {
    return this._value === 'Drafting' || this._value === 'UnitSubmitted'
  }

  canUpdateChecklist(): boolean {
    return !this.isPublished() && !this.isApproved() && !this.isClosed()
  }

  // Valid transitions driven by WorkflowEngine catalog
  canTransitionTo(newState: ProposalState): boolean {
    const meta = COMPENSATION_PAYROLL_STATES[this._value as WorkflowState]
    if (!meta) return false
    return meta.allowedTransitions.some((t) => t.to === newState.value)
  }
}
