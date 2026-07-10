// GET/PATCH/DELETE /api/rnr-payrolls/[id]
import { ok, notFound, badRequest, serverError, readJson } from '../../_lib'
import type { NextRequest } from 'next/server'
import { PrismaRnrPayrollRepository } from '@/infrastructure/persistence/repositories/PrismaRnrPayrollRepository'
import { 
  GetRnrPayrollUseCase, 
  UpdateRnrPayrollStateUseCase, 
  DeleteRnrPayrollUseCase 
} from '@/application/use-cases/rnr-payrolls'

const repo = new PrismaRnrPayrollRepository()

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    const useCase = new GetRnrPayrollUseCase(repo)
    const result = await useCase.execute({ id })
    
    if (result.isSuccess) {
      return ok(result.value)
    }
    
    if (result.error === 'R&R payroll not found') {
      return notFound(result.error)
    }
    
    return serverError('Failed to load R&R payroll', result.error)
  } catch (e) {
    return serverError('Failed to load R&R payroll', e instanceof Error ? e.message : String(e))
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await readJson<{ state?: string }>(req)
    
    const useCase = new UpdateRnrPayrollStateUseCase(repo)
    const result = await useCase.execute({ id, state: body?.state })
    
    if (result.isSuccess) {
      return ok(result.value)
    }
    
    if (result.error === 'R&R payroll not found') {
      return notFound(result.error)
    }
    
    return badRequest(result.error as string)
  } catch (e) {
    return serverError('Failed to update R&R payroll', e instanceof Error ? e.message : String(e))
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    const useCase = new DeleteRnrPayrollUseCase(repo)
    const result = await useCase.execute({ id })
    
    if (result.isSuccess) {
      return ok({ deleted: true })
    }
    
    if (result.error === 'R&R payroll not found') {
      return notFound(result.error)
    }
    
    return badRequest(result.error as string)
  } catch (e) {
    return serverError('Failed to delete R&R payroll', e instanceof Error ? e.message : String(e))
  }
}