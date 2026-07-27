import { Container } from '@/infrastructure/di/modules/core.di'

export class AuditService {
  /**
   * Automatically queues an audit event based on a database change 
   * (e.g., from Prisma Extension)
   */
  async updateRecord(
    table: string, 
    action: 'CREATE' | 'UPDATE' | 'DELETE', 
    conditions: any, 
    oldData: any, 
    newData: any, 
    userId: string = 'system',
    ipAddress?: string,
    userAgent?: string
  ) {
    // Dispatch to centralized JobDispatcherService
    if (!Container.jobDispatcher) {
       console.warn('JobDispatcher not initialized');
       return;
    }
    await Container.jobDispatcher.dispatch('auditLog', {
      type: 'RECORD_CHANGE',
      payload: {
        table,
        action,
        conditions,
        oldData,
        newData,
        userId,
        ipAddress,
        userAgent
      }
    })
  }

  /**
   * Manually logs a custom business activity
   */
  async logCustomAction(options: {
    activity: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  }) {
    // Dispatch to centralized JobDispatcherService
    if (!Container.jobDispatcher) {
       console.warn('JobDispatcher not initialized');
       return;
    }
    await Container.jobDispatcher.dispatch('auditLog', {
      type: 'CUSTOM_ACTIVITY',
      payload: {
        activity: options.activity,
        userId: options.userId || 'system',
        ipAddress: options.ipAddress,
        userAgent: options.userAgent
      }
    })
  }

  /**
   * Fallback for older interface compatibility (if needed)
   */
  async activity(options: any) {
    await this.logCustomAction({
      activity: options.description || options.event || 'UNKNOWN',
      userId: options.metadata?.user_id || 'system',
    })
  }

  /**
   * Fallback for older interface compatibility
   */
  async log(module: string, eventType: string, description: string, metadata: any) {
    await this.logCustomAction({
      activity: description || eventType || 'UNKNOWN',
      userId: metadata?.user_id || 'system',
    })
  }
}

// Export a singleton for backwards compatibility, but prefer DI when possible
export const Audit = new AuditService()
