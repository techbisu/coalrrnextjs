/**
 * ProposalState Value Object - State machine for proposal workflow.
 */
import { ValueObject } from '@/core/base/ValueObject'
import { Result, Fail } from '@/core/result/Result'
import { ValidationException } from '@/core/errors'

export type ProposalStateType = 'Drafting' | 'AreaVetting' | 'Approved' | 'Rejected' | 'Cancelled' | 'LimitBreached' | 'BoardApproved' | 'CrossCollieryVerification' | 'HqVetting'

export class ProposalState extends ValueObject<ProposalStateType> {
  private constructor(value: ProposalStateType) {
    super(value)
  }

  static DRAFTING = new ProposalState('Drafting')
  static AREA_VETTING = new ProposalState('AreaVetting')
  static APPROVED = new ProposalState('Approved')
  static REJECTED = new ProposalState('Rejected')
  static CANCELLED = new ProposalState('Cancelled')
  static LIMIT_BREACHED = new ProposalState('LimitBreached')
  static BOARD_APPROVED = new ProposalState('BoardApproved')
  static CROSS_COLLIERY_VERIFICATION = new ProposalState('CrossCollieryVerification')
  static HQ_VETTING = new ProposalState('HqVetting')

  static tryCreate(value: string): Result<ProposalState, ValidationException> {
    const validStates: ProposalStateType[] = ['Drafting', 'AreaVetting', 'Approved', 'Rejected', 'Cancelled', 'LimitBreached', 'BoardApproved', 'CrossCollieryVerification', 'HqVetting']
    
    if (!validStates.includes(value as ProposalStateType)) {
      return Fail(new ValidationException('Invalid Proposal State', [
        { field: 'state', message: `Must be one of: ${validStates.join(', ')}` }
      ]))
    }

    return { isSuccess: true, isFailure: false, value: new ProposalState(value as ProposalStateType), error: null }
  }

  static fromString(value: string): ProposalState {
    return new ProposalState(value as ProposalStateType)
  }

  get value(): ProposalStateType {
    return this._value
  }

  // State checks
  isDrafting(): boolean {
    return this._value === 'Drafting'
  }

  isAreaVetting(): boolean {
    return this._value === 'AreaVetting'
  }

  isApproved(): boolean {
    return this._value === 'Approved'
  }

  isRejected(): boolean {
    return this._value === 'Rejected'
  }

  isCancelled(): boolean {
    return this._value === 'Cancelled'
  }


  isLimitBreached(): boolean {
    return this._value === 'LimitBreached'
  }

  isBoardApproved(): boolean {
    return this._value === 'BoardApproved'
  }

  isCrossCollieryVerification(): boolean {
    return this._value === 'CrossCollieryVerification'
  }

  isHqVetting(): boolean {
    return this._value === 'HqVetting'
  }

  // Business rules
  canBeEdited(): boolean {
    return this._value === 'Drafting' || this._value === 'CrossCollieryVerification'
  }

  canBeSubmitted(): boolean {
    return this._value === 'Drafting'
  }

  canBeApproved(): boolean {
    return this._value === 'AreaVetting' || this._value === 'HqVetting'
  }

  canBeRejected(): boolean {
    return this._value === 'AreaVetting' || this._value === 'HqVetting' || this._value === 'Approved'
  }

  canBeCancelled(): boolean {
    return this._value === 'Drafting' || this._value === 'AreaVetting' || this._value === 'CrossCollieryVerification' || this._value === 'HqVetting'
  }

  canAddPlots(): boolean {
    return this._value === 'Drafting'
  }

  canRemovePlots(): boolean {
    return this._value === 'Drafting'
  }

  canUpdateChecklist(): boolean {
    return this._value === 'Drafting' || this._value === 'AreaVetting' || this._value === 'HqVetting'
  }

  // Valid transitions
  canTransitionTo(newState: ProposalState): boolean {
    const transitions: Record<ProposalStateType, ProposalStateType[]> = {
      Drafting: ['AreaVetting', 'Cancelled', 'LimitBreached', 'CrossCollieryVerification'],
      AreaVetting: ['HqVetting', 'Rejected', 'Drafting'],
      HqVetting: ['Approved', 'Rejected', 'AreaVetting'],
      Approved: ['Rejected'],
      Rejected: ['Drafting'],
      Cancelled: [],
      LimitBreached: ['BoardApproved', 'Cancelled'],
      BoardApproved: ['AreaVetting'],
      CrossCollieryVerification: ['Drafting', 'Cancelled'],
    }

    return transitions[this._value]?.includes(newState.value) ?? false
  }
}
