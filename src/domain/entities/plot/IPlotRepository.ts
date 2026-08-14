/**
 * Plot Repository Interface - Contract for plot persistence.
 * Defined in the domain layer, implemented in infrastructure layer.
 */

export interface PlotData {
  id: string;
  plot_no?: string;
  plot_number: string;
  area_acres: string;
  mouza_name?: string;
  acq_status?: string;
}

export interface IPlotRepository {
  findById(id: string): Promise<PlotData | null>;
  findAllPlots(where?: any): Promise<any[]>;
}
