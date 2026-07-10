import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result } from '@/core/result/Result'
import { IPlotRepository } from '@/domain/entities/plot/IPlotRepository'

export class GetPlotsUseCase implements IUseCase<void, any[]> {
  constructor(private plotRepository: IPlotRepository) {}

  async execute(): Promise<Result<any[]>> {
    try {
      const plots = await this.plotRepository.findAllPlots()
      
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
