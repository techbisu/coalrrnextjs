import { PrismaDashboardRepository } from '../../persistence/repositories/PrismaDashboardRepository'
import { GetSystemDashboardUseCase } from '@/application/use-cases/dashboard/GetSystemDashboardUseCase'

// Repositories
export const dashboardRepository = new PrismaDashboardRepository()

// Use Cases
export const getSystemDashboardUseCase = new GetSystemDashboardUseCase(dashboardRepository)
