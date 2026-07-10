export interface INomineePoolRepository {
  findAllPools(): Promise<any[]>
  findPoolById(id: string): Promise<any | null>
}
