import { Result, Fail } from '@/core/result/Result'
import { IProjectRepository } from '@/domain/entities/project/ProjectRepository.interface'
import { IProjectApprovalLocationRepository } from '@/domain/entities/project/ProjectApprovalLocationRepository.interface'
import { Area } from '@/domain/value-objects/Area'
import { Money } from '@/domain/value-objects/Money'
import { ProjectNotFoundException } from '@/domain/entities/project/Project'

export class ComplianceMonitorService {
  constructor(
    private readonly projectRepository: IProjectRepository,
    private readonly locationRepository: IProjectApprovalLocationRepository
  ) {}

  /**
   * Checks if proposed additions can be accommodated within the project's approved baseline.
   */
  async checkBaselineCompliance(
    projectId: string,
    proposedAreaAcres: number | string,
    proposedBudgetINR: number | string,
    proposedJobs: number
  ): Promise<Result<{ withinBaseline: boolean; overflow?: { area?: string; budget?: string; jobs?: string } }>> {
    const project = await this.projectRepository.findById(projectId)
    if (!project) {
      return Fail(new ProjectNotFoundException(projectId).message)
    }

    const proposedAreaResult = Area.tryCreate(proposedAreaAcres, 'ACRES')
    if (proposedAreaResult.isFailure) return Fail('Invalid proposed area')

    const proposedBudgetResult = Money.tryCreate(proposedBudgetINR, 'INR')
    if (proposedBudgetResult.isFailure) return Fail('Invalid proposed budget')

    const proposedArea = (proposedAreaResult as any).value
    const proposedBudget = (proposedBudgetResult as any).value

    const accommodationResult = project.canAccommodate(proposedArea, proposedBudget, proposedJobs)

    if (accommodationResult.isFailure) {
      // In a real scenario we'd want more granular overflow details, but based on the error string we can map it
      return Result.ok({
        withinBaseline: false,
        overflow: {
          reason: accommodationResult.error
        }
      })
    }

    return Result.ok({ withinBaseline: true })
  }

  /**
   * Checks if a given Mouza is authorized for acquisition under any baseline approval of the project.
   */
  async checkMouzaAuthorized(projectId: string, mouzaLgd: bigint): Promise<Result<boolean>> {
    const project = await this.projectRepository.findById(projectId)
    if (!project) {
      return Fail(new ProjectNotFoundException(projectId).message)
    }

    // Since Location is mapped to Approval, and Approval to Project, we need to check if 
    // there's an active location for this mouza linked to a project approval.
    // However, our current repository structure doesn't easily let us query locations by projectId and mouzaLgd
    // without a custom query method in the infrastructure. We'll use a domain service or custom repo method.
    // For now, this is a conceptual implementation. We assume the repository can handle this or we'd fetch it via Prisma directly if needed.

    // Using an imaginary method on locationRepository or we could inject db directly here if we want to violate pure domain a bit for a read model
    // Better way: IProjectApprovalLocationRepository.isMouzaAuthorized(projectId, mouzaLgd)
    // Wait, the repository is IProjectApprovalLocationRepository. I will add this method to the interface.
    if ('isMouzaAuthorized' in this.locationRepository) {
      const isAuth = await (this.locationRepository as any).isMouzaAuthorized(projectId, mouzaLgd)
      return Result.ok(isAuth)
    }

    return Result.ok(false)
  }
}
