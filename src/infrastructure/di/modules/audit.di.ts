import { PrismaAuditLogRepository } from '@/modules/audit-log/infrastructure/persistence/PrismaAuditLogRepository';
import { GetAuditLogsUseCase } from '@/modules/audit-log/application/use-cases/GetAuditLogsUseCase';

export const auditLogRepository = new PrismaAuditLogRepository();
export const getAuditLogsUseCase = new GetAuditLogsUseCase(auditLogRepository);
