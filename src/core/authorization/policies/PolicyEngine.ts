import { IPolicy } from '../types'
import { authService } from '@/infrastructure/di/Container'

class PolicyEngine {
  private policies = new Map<string, IPolicy>()

  register(entity_type: string, policy: IPolicy) {
    this.policies.set(entity_type, policy)
  }

  getPolicy(entity_type: string): IPolicy | undefined {
    return this.policies.get(entity_type)
  }

  async authorize(entity_type: string, action: string, user: any, entity: any, ...args: any[]): Promise<boolean> {
    // Super admins always bypass
    if (user.id && await authService.isSuperAdmin(user.id)) return true

    const policy = this.getPolicy(entity_type)
    if (!policy) return false

    const handler = policy[action]
    if (!handler) return false

    return await handler(user, entity, ...args)
  }
}

export const PolicyEngineInstance = new PolicyEngine()
