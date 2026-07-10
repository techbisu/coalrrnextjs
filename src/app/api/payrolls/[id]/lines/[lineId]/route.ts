import { ok, badRequest, notFound, serverError } from '../../../../_lib'
import type { NextRequest } from 'next/server'
import { PrismaPayrollsRepository } from '@/infrastructure/persistence/repositories/PrismaPayrollsRepository'
import { DeletePayrollLineUseCase } from '@/application/use-cases/payrolls/DeletePayrollLineUseCase'

type Ctx = { params: Promise<{ id: string; lineId: string }> }

const repo = new PrismaPayrollsRepository()
const deletePayrollLineUseCase = new DeletePayrollLineUseCase(repo)

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const { id, lineId } = await ctx.params
    const result = await deletePayrollLineUseCase.execute({ id, lineId })

    if (result.isFailure) {
      if (String(result.error) === 'Payroll not found') return notFound('Payroll not found')
      return badRequest(String(result.error))
    }

    return ok(result.value)
  } catch (e) {
    return serverError('Failed to delete line', e instanceof Error ? e.message : String(e))
  }
}
