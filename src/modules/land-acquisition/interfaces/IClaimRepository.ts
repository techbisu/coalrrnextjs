export interface IClaimRepository {
  findAll(): Promise<any[]>
  findById(id: string): Promise<any | null>
  findByCitizenAndPlot(citizen_id_hash: string, plot_id: string): Promise<any | null>
  create(data: any): Promise<any>
  update(id: string, data: any): Promise<any>
}
