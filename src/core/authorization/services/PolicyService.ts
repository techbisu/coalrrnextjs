import { IPolicy } from '../types'
import { AuthorizationService } from './AuthorizationService'

class PolicyEngine {
  private policies = new Map<string, IPolicy>()

  register(entityType: string, policy: IPolicy) {
    this.policies.set(entityType, policy)
  }

  getPolicy(entityType: string): IPolicy | undefined {
    return this.policies.get(entityType)
  }

  async authorize(entityType: string, action: string, user: any, entity: any, ...args: any[]): Promise<boolean> {
    // Super admins always bypass
    if (user.id && await AuthorizationService.isSuperAdmin(user.id)) return true

    const policy = this.getPolicy(entityType)
    if (!policy) return false

    const handler = policy[action]
    if (!handler) return false

    return await handler(user, entity, ...args)
  }
}

export const PolicyService = new PolicyEngine()
