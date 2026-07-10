import { AuditEventPayload } from '../services/AuditQueue'

export interface IAuditRepository {
  saveBatch(events: AuditEventPayload[]): Promise<void>
}
