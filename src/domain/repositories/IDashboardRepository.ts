export interface DashboardStats {
  projects: any[]
  plots: any[]
  claims: any[]
  payrolls: any[]
  ledger_entries: any[]
  nomineePools: any[]
  employmentApps: any[]
  grievances: any[]
  reviewTasks: any[]
}

export interface IDashboardRepository {
  getSystemDashboardStats(): Promise<DashboardStats>
}
