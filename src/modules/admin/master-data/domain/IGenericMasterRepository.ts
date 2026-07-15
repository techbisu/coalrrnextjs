import { Result } from '@/core/result/Result'

export interface IGenericMasterRepository {
  findAll(modelName: string): Promise<Result<any[]>>
  findById(modelName: string, pkField: string, id: any): Promise<Result<any>>
  create(modelName: string, data: any): Promise<Result<any>>
  update(modelName: string, pkField: string, id: any, data: any): Promise<Result<any>>
}
