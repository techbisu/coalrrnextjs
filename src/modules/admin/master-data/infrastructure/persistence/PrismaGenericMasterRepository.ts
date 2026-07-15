import { db as prisma } from '@/lib/db'
import { Result, Ok, Fail } from '@/core/result/Result'
import { IGenericMasterRepository } from '../../domain/IGenericMasterRepository'

export class PrismaGenericMasterRepository implements IGenericMasterRepository {
  async findAll(modelName: string): Promise<Result<any[]>> {
    try {
      // @ts-ignore: Dynamic model delegation
      const data = await prisma[modelName].findMany()
      return Ok(data)
    } catch (e: any) {
      return Fail('Failed to fetch master data: ' + e.message)
    }
  }

  async findById(modelName: string, pkField: string, id: any): Promise<Result<any>> {
    try {
      const data = await (prisma as any)[modelName].findUnique({
        where: { [pkField]: id }
      })
      if (!data) return Fail('Record not found')
      return Ok(data)
    } catch (e: any) {
      return Fail('Failed to fetch master data: ' + e.message)
    }
  }

  async create(modelName: string, data: any): Promise<Result<any>> {
    try {
      // @ts-ignore
      const result = await (prisma as any)[modelName].create({ data })
      return Ok(result)
    } catch (e: any) {
      return Fail('Failed to create master data: ' + e.message)
    }
  }

  async update(modelName: string, pkField: string, id: any, data: any): Promise<Result<any>> {
    try {
      // @ts-ignore
      const result = await prisma[modelName].update({
        where: { [pkField]: id },
        data
      })
      return Ok(result)
    } catch (e: any) {
      return Fail('Failed to update master data: ' + e.message)
    }
  }
}
