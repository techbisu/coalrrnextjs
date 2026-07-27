import { Result } from '@/core/result/Result';
import { IAuditLogRepository, AuditLogQueryFilters, PaginatedAuditLogs } from '../../domain/repositories/IAuditLogRepository';

export class GetAuditLogsUseCase {
  constructor(private readonly auditLogRepository: IAuditLogRepository) {}

  async execute(filters: AuditLogQueryFilters, userId: string): Promise<Result<PaginatedAuditLogs, string>> {
    try {
      // Basic validation
      if (filters.page && filters.page < 1) {
        return Result.fail('Page must be greater than 0');
      }
      
      const logs = await this.auditLogRepository.findLogs(filters);
      return Result.ok(logs);
    } catch (error: any) {
      console.error('Error fetching audit logs:', error);
      return Result.fail('Failed to fetch audit logs');
    }
  }
}
