// GET /api/rnr-payrolls — List R&R asset payrolls
// POST /api/rnr-payrolls — Create new R&R payroll
import { ok, badRequest, serverError, readJson } from '../_lib'
import { PrismaRnrPayrollRepository } from '@/infrastructure/persistence/repositories/PrismaRnrPayrollRepository'
import { GetRnrPayrollsUseCase, CreateRnrPayrollUseCase } from '@/application/use-cases/rnr-payrolls'

const repo = new PrismaRnrPayrollRepository()

export async function GET() {
  try {
    const useCase = new GetRnrPayrollsUseCase(repo)
    const result = await useCase.execute()
    
    if (result.isSuccess) {
      return ok(result.value)
    }
    
    return serverError('Failed to load R&R payrolls', result.error)
  } catch (e) {
    return serverError('Failed to load R&R payrolls', e instanceof Error ? e.message : String(e))
  }
}

export async function POST(req: Request) {
  try {
    const body = await readJson<{ project_id?: string }>(req)
    if (!body?.project_id) return badRequest('project_id is required')

    const useCase = new CreateRnrPayrollUseCase(repo)
    const result = await useCase.execute({ project_id: body.project_id })
    
    if (result.isSuccess) {
      return ok(result.value)
    }
    
    return badRequest(result.error as string)
  } catch (e) {
    return serverError('Failed to create R&R payroll', e instanceof Error ? e.message : String(e))
  }
}
