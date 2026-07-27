export interface AuditLogQueryFilters {
  page?: number;
  limit?: number;
  action_by?: string;
  table_name?: string;
  activity_type?: string; // search within activity text
  startDate?: Date;
  endDate?: Date;
}

export interface PaginatedAuditLogs {
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IAuditLogRepository {
  findLogs(filters: AuditLogQueryFilters): Promise<PaginatedAuditLogs>;
}
