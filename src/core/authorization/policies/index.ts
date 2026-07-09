import { PolicyService } from '../services/PolicyService'
import { ProposalPolicy } from './ProposalPolicy'

// Register policies
PolicyService.register('proposal', ProposalPolicy)

// Export for usage
export { ProposalPolicy }
