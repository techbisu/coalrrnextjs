import { ok, badRequest, serverError, readJson } from '../_lib'
import type { NextRequest } from 'next/server'
import { PrismaPayrollsRepository } from '@/infrastructure/persistence/repositories/PrismaPayrollsRepository'
import { GetPayrollsUseCase } from '@/application/use-cases/payrolls/GetPayrollsUseCase'
import { CreatePayrollUseCase } from '@/application/use-cases/payrolls/CreatePayrollUseCase'

const repo = new PrismaPayrollsRepository()
const getPayrollsUseCase = new GetPayrollsUseCase(repo)
const createPayrollUseCase = new CreatePayrollUseCase(repo)

export async function GET() {
  try {
    const result = await getPayrollsUseCase.execute()
    
    if (result.isFailure) {
      return serverError('Failed to load payrolls', result.error)
    }
    
    return ok(result.value)
  } catch (e) {
    return serverError('Failed to load payrolls', e instanceof Error ? e.message : String(e))
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await readJson<{ project_id?: string; payroll_code?: string; multiplication_factor?: string }>(req)
    if (!body) return badRequest('Invalid body')

    const result = await createPayrollUseCase.execute(body)

    if (result.isFailure) {
      return badRequest(String(result.error))
    }

    return ok(result.value, { status: 201 })
  } catch (e) {
    return serverError('Failed to create payroll', e instanceof Error ? e.message : String(e))
  }
}
