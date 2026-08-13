import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'
import { Container } from '@/infrastructure/di/Container'
import { authorizeApi } from '@/authorization/middleware/authorize'
import { z } from 'zod'
import { ChecklistQuerySchema } from '@/core/validation/schemas/checklist.schema'

export async function GET(req: NextRequest) {
  try {
    // 1. Mandatory Auth Check
    const auth = await authorizeApi('project.view')
    if (auth.error) return auth.error

    // 2. Input Validation (Zod)
    const { searchParams } = new URL(req.url)
    const query = {
      moduleCode: searchParams.get('moduleCode'),
      checkableType: searchParams.get('checkableType'),
      checkableId: searchParams.get('checkableId'),
    }

    const parseResult = ChecklistQuerySchema.safeParse(query)
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid parameters', details: parseResult.error }, { status: 400 })
    }

    const { moduleCode, checkableType, checkableId } = parseResult.data;

    // 3. Execute UseCase
    const result = await Container.getChecklistStatusUseCase!.execute({
      moduleCode,
      checkableType,
      checkableId
    });

    if (result.isFailure) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.value);
  } catch (error: any) {
    console.error('[API] Error fetching checklist status:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
