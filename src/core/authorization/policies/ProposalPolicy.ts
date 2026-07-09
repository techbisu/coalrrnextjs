import { IPolicy } from '../types'

export const ProposalPolicy: IPolicy = {
  view: async (user, proposal) => {
    return true
  },
  
  edit: async (user, proposal) => {
    // Context-based authorization rule: only unit_office or area_office can edit
    // In a real system, you might check if user.collieryCode === proposal.collieryCode
    return true
  },
  
  approve: async (user, proposal) => {
    return true
  },
  
  delete: async (user, proposal) => {
    return false // Example of a strict deny
  }
}
