// POST /api/rnr-payrolls/[id]/lines — Add line to R&R payroll
import { ok, notFound, badRequest, serverError, readJson } from '../../../_lib'
import type { NextRequest } from 'next/server'
import { PrismaRnrPayrollRepository } from '@/infrastructure/persistence/repositories/PrismaRnrPayrollRepository'
import { AddRnrPayrollLineUseCase } from '@/application/use-cases/rnr-payrolls'

const repo = new PrismaRnrPayrollRepository()

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await readJson<{ beneficiary_name?: string; entitlement_type?: string; valuation_amount?: string; pwd_rate_reference?: string }>(req)
    
    const useCase = new AddRnrPayrollLineUseCase(repo)
    const result = await useCase.execute({
      payroll_id: id,
      beneficiary_name: body?.beneficiary_name,
      entitlement_type: body?.entitlement_type,
      valuation_amount: body?.valuation_amount,
      pwd_rate_reference: body?.pwd_rate_reference,
    })
    
    if (result.isSuccess) {
      return ok(result.value)
    }
    
    if (result.error === 'R&R payroll not found') {
      return notFound(result.error)
    }
    
    return badRequest(result.error as string)
  } catch (e) {
    return serverError('Failed to add R&R line', e instanceof Error ? e.message : String(e))
  }
}