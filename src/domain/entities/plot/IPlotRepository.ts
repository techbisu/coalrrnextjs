/**
 * Plot Repository Interface - Contract for plot persistence.
 * Defined in the domain layer, implemented in infrastructure layer.
 */

// Since we don't have a full Plot Aggregate Root yet, we use a simple DTO interface.
export interface PlotData {
  id: string
  plot_number: string
  area_acres: string
}

export interface IPlotRepository {
  findById(id: string): Promise<PlotData | null>
  findAllPlots(): Promise<any[]>
}
