import { PolicyEngineInstance } from './PolicyEngine'
import { ProposalPolicy } from './ProposalPolicy'

// Register policies
PolicyEngineInstance.register('proposal', ProposalPolicy)

// Export for usage
export { ProposalPolicy, PolicyEngineInstance }
