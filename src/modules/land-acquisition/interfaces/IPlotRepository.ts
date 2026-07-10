export interface IPlotRepository {
  findAllPlots(): Promise<any[]>
}
