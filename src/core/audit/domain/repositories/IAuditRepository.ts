import { ActivityLog } from '../entities/ActivityLog'
import { ApplicationLog } from '../entities/ApplicationLog'

export interface IAuditRepository {
  saveActivityLog(log: ActivityLog): Promise<void>
  saveApplicationLog(log: ApplicationLog): Promise<void>
  searchActivityLogs(conditions: any, start: number, limit: number, search?: string): Promise<{ logs: any[], totalCount: number, filteredCount: number }>
}
