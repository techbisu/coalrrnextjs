import { jobDispatcher } from '@/core/jobs/services/JobDispatcherService'

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
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
    timestamp?: Date
  ) {
    // Dispatch to centralized JobDispatcherService
    if (!jobDispatcher) {
       console.warn('JobDispatcher not initialized');
       return;
    }
    await jobDispatcher.dispatch('auditLog', {
      type: 'RECORD_CHANGE',
      payload: {
        table,
        action,
        conditions,
        oldData,
        newData,
        userId,
        ipAddress,
        userAgent,
        timestamp: timestamp || new Date()
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
    userAgent?: string,
    timestamp?: Date
  }) {
    // Dispatch to centralized JobDispatcherService
    if (!jobDispatcher) {
       console.warn('JobDispatcher not initialized');
       return;
    }
    await jobDispatcher.dispatch('auditLog', {
      type: 'CUSTOM_ACTIVITY',
      payload: {
        activity: options.activity,
        userId: options.userId,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        timestamp: options.timestamp || new Date()
      }
    })
  }

  /**
   * Fallback for older interface compatibility (if needed)
   */
  async activity(options: any) {
    await this.logCustomAction({
      activity: options.description || options.event || 'UNKNOWN',
      userId: options.metadata?.user_id,
    })
  }

  /**
   * Fallback for older interface compatibility
   */
  async log(module: string, eventType: string, description: string, metadata: any) {
    await this.logCustomAction({
      activity: description || eventType || 'UNKNOWN',
      userId: metadata?.user_id,
    })
  }
}

// Export a singleton for backwards compatibility, but prefer DI when possible
export const Audit = new AuditService()
