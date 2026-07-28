import { PrismaAuditRepository } from '@/core/audit/infrastructure/persistence/PrismaAuditRepository'
import { ActivityLog } from '@/core/audit/domain/entities/ActivityLog'
import { ApplicationLog } from '@/core/audit/domain/entities/ApplicationLog'
import { generateDiff } from '@/core/audit/utils/diff'

// In a fully strictly-injected Clean Architecture setup, the repository would be passed into the job handler. 
// For background workers mapped in a simple registry, instantiating the Prisma repo here is acceptable.
const auditRepository = new PrismaAuditRepository()

export interface AuditLogJobPayload {
  type: 'CUSTOM_ACTIVITY' | 'RECORD_CHANGE'
  payload: any
}

export const auditLogHandler = async (job: AuditLogJobPayload): Promise<void> => {
  if (job.type === 'CUSTOM_ACTIVITY') {
    const { activity, userId, ipAddress, userAgent } = job.payload
    
    const activityLogResult = ActivityLog.create({
      activity,
      actionBy: userId,
      ipAddress,
      userAgent
    })

    if (activityLogResult.isSuccess && activityLogResult.value) {
      await auditRepository.saveActivityLog(activityLogResult.value)
    }
  } else if (job.type === 'RECORD_CHANGE') {
    const { table, action, conditions, oldData, newData, userId, ipAddress, userAgent } = job.payload
    
    let activityMessage = ''
    let appLogId: string | null = null;

    if (action === 'CREATE') {
      // Find a suitable ID field for the human-readable message
      const idField = Object.keys(newData || {}).find(k => k === 'id' || k.toLowerCase().endsWith('id') || k.toLowerCase().endsWith('cd') || k === 'code') || Object.keys(newData || {})[0];
      const entityId = idField && newData ? newData[idField] : 'unknown';
      activityMessage = `Data Created in table ${table} (Identifier: ${entityId})`
    } else {
      // For UPDATE and DELETE, we generate a diff and create an ApplicationLog
      const diff = generateDiff(oldData || {}, newData || [])
      
      // If there's no diff and it's an update, skip entirely
      if (action === 'UPDATE' && diff.length === 0) {
        return
      }

      // Extract only modified fields for storage to save space on UPDATE
      let finalOldData = oldData;
      let finalNewData = newData;

      if (action === 'UPDATE' && diff.length > 0) {
        finalOldData = {};
        finalNewData = {};
        diff.forEach(d => {
          finalOldData[d.field] = d.old;
          finalNewData[d.field] = d.new;
        });
      }

      // Create Application Log
      const appLogResult = ApplicationLog.create({
        tableName: table,
        conditions,
        oldData: finalOldData,
        newData: finalNewData
      })

      if (appLogResult.isFailure || !appLogResult.value) {
        throw new Error(appLogResult.error as string)
      }

      await auditRepository.saveApplicationLog(appLogResult.value)
      appLogId = appLogResult.value.id

      // Construct activity message for UPDATE and DELETE
      if (action === 'UPDATE') {
        activityMessage = `Data Modified in table ${table}`
      } else if (action === 'DELETE') {
        activityMessage = `Data Deleted in table ${table}`
      }

      if (conditions && Object.keys(conditions).length > 0) {
        activityMessage += ` where ${JSON.stringify(conditions)}`
      }
    }

    const activityLogResult = ActivityLog.create({
      activity: activityMessage,
      tableName: table,
      actionBy: userId,
      ipAddress,
      userAgent,
      applicationLogId: appLogId
    })

    if (activityLogResult.isSuccess && activityLogResult.value) {
      await auditRepository.saveActivityLog(activityLogResult.value)
    }
  }
}
