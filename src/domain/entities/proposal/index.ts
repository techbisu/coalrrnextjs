export { 
  Proposal, 
  ProposalNotEditableException, 
  ProposalNotSubmittableException,
  InvalidProposalTransitionException,
  ChecklistItemNotFoundException
} from './Proposal'
export type { ProposalProps, CreateProposalProps, UpdateProposalProps } from './Proposal'
export { ProposalId } from './ProposalId'
export { ScheduleCode } from './ScheduleCode'
export { AcquisitionMode, type AcquisitionModeType, type AcquisitionModeMetadata } from './AcquisitionMode'
export { ProposalState, type ProposalStateType } from './ProposalState'
export { Checklist, type ChecklistItem, type ChecklistProps } from './Checklist'
export type { IProposalRepository, IProposalQueryOptions } from './ProposalRepository.interface'
