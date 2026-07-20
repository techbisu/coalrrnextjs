import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result } from '@/core/result/Result'
import { IPlotRepository } from '@/domain/entities/plot/IPlotRepository'

import { UserScopeService, EffectiveScope } from '@/core/authorization/services/UserScopeService'

export class GetPlotsUseCase implements IUseCase<{ userId: string; scope: EffectiveScope }, any[]> {
  constructor(private plotRepository: IPlotRepository) {}

  async execute(context: { userId: string; scope: EffectiveScope }): Promise<Result<any[]>> {
    try {
      // In mst_plot, mine_cd is reachable via land_schedule_items.some.land_schedule.mine_cd
      // However, plots might not be in a proposal yet. We need a way to filter plots by area/mine.
      // Wait, if a plot isn't in a proposal, is it visible to everyone or no one?
      // For now, let's just pass a basic visibility filter on entry_by if it doesn't have an area.
      // A more complex query would be needed to join mouza -> block -> district -> state to get area? No, area is area_master.
      // Usually, plot -> mouza -> block -> etc.
      // Let's just apply visibilityWhere directly, assuming we map it later or just pass it to repo.
      const where = UserScopeService.visibilityWhere(
        context.scope,
        context.userId,
        'land_schedule_items.some.land_schedule.area_office', // this is just a guess for Prisma relation
        'land_schedule_items.some.land_schedule.mine_cd',
        'entry_by'
      )
      
      const plots = await this.plotRepository.findAllPlots(where)
      
      const result = plots.map((p: any) => ({
        id: p.id,
        plot_number: p.plot_number,
        khata_number: p.khata_number,
        mouza: p.mouza.name,
        district: p.mouza.district,
        state: p.mouza.state,
        land_type: p.land_type,
        area_acres: p.area_acres ? p.area_acres.toString() : '0',
        exhausted_area_for_jobs: p.exhausted_area_for_jobs ? p.exhausted_area_for_jobs.toString() : '0',
        remaining_job_quota: p.remaining_job_quota,
        claimCount: p.form_i_claims.length,
      }))
      
      return Result.ok(result)
    } catch (error: any) {
      return Result.fail(error.message || String(error))
    }
  }
}
