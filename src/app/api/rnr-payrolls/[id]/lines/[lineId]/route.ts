// PATCH/DELETE /api/rnr-payrolls/[id]/lines/[lineId]
import { ok, notFound, badRequest, serverError, readJson } from '../../../../_lib'
import type { NextRequest } from 'next/server'
import { PrismaRnrPayrollRepository } from '@/infrastructure/persistence/repositories/PrismaRnrPayrollRepository'
import { 
  UpdateRnrPayrollLineUseCase, 
  DeleteRnrPayrollLineUseCase 
} from '@/application/use-cases/rnr-payrolls'

const repo = new PrismaRnrPayrollRepository()

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; lineId: string }> }) {
  try {
    const { id, lineId } = await params
    const body = await readJson<Record<string, unknown>>(req)
    if (!body) return badRequest('Invalid body')

    const useCase = new UpdateRnrPayrollLineUseCase(repo)
    const result = await useCase.execute({
      payroll_id: id,
      lineId,
      beneficiary_name: body.beneficiary_name ? String(body.beneficiary_name) : undefined,
      entitlement_type: body.entitlement_type ? String(body.entitlement_type) : undefined,
      valuation_amount: body.valuation_amount ? String(body.valuation_amount) : undefined,
      pwd_rate_reference: body.pwd_rate_reference !== undefined ? (body.pwd_rate_reference ? String(body.pwd_rate_reference) : null) : undefined,
      formula_snapshot: body.formula_snapshot ? String(body.formula_snapshot) : undefined,
    })
    
    if (result.isSuccess) {
      return ok(result.value)
    }
    
    if (result.error === 'Line not found') {
      return notFound(result.error)
    }
    
    return badRequest(result.error as string)
  } catch (e) {
    return serverError('Failed to update line', e instanceof Error ? e.message : String(e))
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; lineId: string }> }) {
  try {
    const { id, lineId } = await params
    
    const useCase = new DeleteRnrPayrollLineUseCase(repo)
    const result = await useCase.execute({ payroll_id: id, lineId })
    
    if (result.isSuccess) {
      return ok({ deleted: true })
    }
    
    if (result.error === 'Line not found') {
      return notFound(result.error)
    }
    
    return badRequest(result.error as string)
  } catch (e) {
    return serverError('Failed to delete line', e instanceof Error ? e.message : String(e))
  }
}