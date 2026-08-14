import { IUseCase } from "@/core/interfaces/UseCase.interface";
import { Result } from "@/core/result/Result";
import { IPlotRepository } from "@/domain/entities/plot/IPlotRepository";

export class GetPlotsUseCase implements IUseCase<any, any[]> {
  constructor(private plotRepository: IPlotRepository) {}

  async execute(_context?: any): Promise<Result<any[]>> {
    try {
      const plots = await this.plotRepository.findAllPlots();
      
      const result = plots.map((p: any) => ({
        id: p.id,
        plot_no: p.plot_no || p.plot_number,
        plot_number: p.plot_no || p.plot_number || `Plot #${p.id}`,
        khata_number: p.khata_number || "N/A",
        mouza: typeof p.mouza === "string" ? p.mouza : p.mouza?.mouza_en || "Approved Mouza",
        mouza_lgd: p.mouza_lgd,
        state_lgd: p.state_lgd,
        district_lgd: p.district_lgd,
        block_lgd: p.block_lgd,
        ps_lgd: p.ps_lgd,
        notification_no: p.notification_no || "ECL/LA/2026/NOT-01",
        land_type: p.land_type || "Agricultural",
        area_acres: p.area_acres ? p.area_acres.toString() : "0",
        exhausted_area_for_jobs: "0",
        remaining_job_quota: 1,
        claimCount: 0,
      }));

      return Result.ok(result);
    } catch (error: any) {
      return Result.fail(error.message || String(error));
    }
  }
}
