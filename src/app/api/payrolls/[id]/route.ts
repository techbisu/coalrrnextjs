import { ok, badRequest, notFound, serverError, readJson } from '../../_lib'
import type { NextRequest } from 'next/server'
import { PrismaPayrollsRepository } from '@/infrastructure/persistence/repositories/PrismaPayrollsRepository'
import { GetPayrollByIdUseCase } from '@/application/use-cases/payrolls/GetPayrollByIdUseCase'
import { UpdatePayrollFactorUseCase } from '@/application/use-cases/payrolls/UpdatePayrollFactorUseCase'
import { AddPayrollLineUseCase } from '@/application/use-cases/payrolls/AddPayrollLineUseCase'

type Ctx = { params: Promise<{ id: string }> }

const repo = new PrismaPayrollsRepository()
const getPayrollByIdUseCase = new GetPayrollByIdUseCase(repo)
const updatePayrollFactorUseCase = new UpdatePayrollFactorUseCase(repo)
const addPayrollLineUseCase = new AddPayrollLineUseCase(repo)

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params
    const result = await getPayrollByIdUseCase.execute(id)

    if (result.isFailure) {
      if (String(result.error) === 'Payroll not found') return notFound('Payroll not found')
      return serverError('Failed to load payroll', result.error)
    }

    return ok(result.value)
  } catch (e) {
    return serverError('Failed to load payroll', e instanceof Error ? e.message : String(e))
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params
    const body = await readJson<{
      action: 'add_line' | 'update_factor'
      landowner_name?: string
      plot_reference?: string
      land_value?: string
      asset_value?: string
      years_since_notification?: number
      multiplication_factor?: string
    }>(req)
    if (!body) return badRequest('Invalid body')

    if (body.action === 'update_factor') {
      const result = await updatePayrollFactorUseCase.execute({ id, multiplication_factor: body.multiplication_factor })
      if (result.isFailure) {
        if (String(result.error) === 'Payroll not found') return notFound('Payroll not found')
        return badRequest(String(result.error))
      }
      return ok(result.value)
    }

    if (body.action === 'add_line') {
      const result = await addPayrollLineUseCase.execute({
        id,
        landowner_name: body.landowner_name,
        plot_reference: body.plot_reference,
        land_value: body.land_value,
        asset_value: body.asset_value,
        years_since_notification: body.years_since_notification,
      })
      if (result.isFailure) {
        if (String(result.error) === 'Payroll not found') return notFound('Payroll not found')
        return badRequest(String(result.error))
      }
      return ok(result.value, { status: 201 })
    }

    return badRequest('Unknown action')
  } catch (e) {
    return serverError('Failed to update payroll', e instanceof Error ? e.message : String(e))
  }
}
