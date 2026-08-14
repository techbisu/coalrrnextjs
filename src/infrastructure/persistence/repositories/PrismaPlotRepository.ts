import { db } from "@/lib/db";
import {
  IPlotRepository,
  PlotData,
} from "@/domain/entities/plot/IPlotRepository";

export class PrismaPlotRepository implements IPlotRepository {
  async findById(id: string): Promise<PlotData | null> {
    const isNumeric = !isNaN(Number(id));
    const plot = await db.plot_schedule.findFirst({
      where: {
        OR: [
          ...(isNumeric ? [{ schedule_id: BigInt(id) }] : []),
          { plot_no: id },
          { plot_number: id },
        ],
      },
      include: {
        mouza: true,
      },
    });

    if (!plot) return null;

    return {
      id: String(plot.schedule_id),
      plot_no: plot.plot_no,
      plot_number: plot.plot_no || plot.plot_number || String(plot.schedule_id),
      area_acres: plot.to_be_acquired_area ? plot.to_be_acquired_area.toString() : "0",
      mouza_name: plot.mouza?.mouza_en || "Approved Mouza",
      acq_status: plot.acq_status,
    };
  }

  async findAllPlots(_where?: any): Promise<any[]> {
    try {
      const plots = await db.plot_schedule.findMany({
        take: 1000,
        include: {
          mouza: true,
          acq_proposal: true,
        },
        orderBy: [{ plot_no: "asc" }],
      });

      return plots.map((plot) => ({
        id: String(plot.schedule_id),
        plot_no: plot.plot_no,
        plot_number: plot.plot_no || plot.plot_number || `Plot #${plot.schedule_id}`,
        khata_number: plot.jl_no ? `JL-${plot.jl_no}` : "N/A",
        mouza: plot.mouza?.mouza_en || (plot.jl_no ? `JL-${plot.jl_no} Mouza` : "Approved Mouza"),
        mouza_lgd: plot.mouza_lgd ? String(plot.mouza_lgd) : undefined,
        state_lgd: plot.state_lgd ? String(plot.state_lgd) : undefined,
        district_lgd: plot.district_lgd ? String(plot.district_lgd) : undefined,
        block_lgd: plot.block_lgd ? String(plot.block_lgd) : undefined,
        ps_lgd: plot.ps_lgd ? String(plot.ps_lgd) : undefined,
        notification_no: plot.acq_proposal?.proposal_no || "ECL/LA/2026/NOT-01",
        land_type: plot.plot_ty || "Agricultural",
        area_acres: plot.to_be_acquired_area ? plot.to_be_acquired_area.toString() : "0",
        exhausted_area_for_jobs: "0",
        remaining_job_quota: 1,
        claimCount: 0,
      }));
    } catch (err) {
      console.error("Error fetching plot_schedule rows:", err);
      return [];
    }
  }
}
