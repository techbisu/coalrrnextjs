// POST /api/math/preview — live Math Engine preview (spec §2.1.4 MathPreviewAction)
// Used by the MathPreviewPanel on every debounced keystroke in the payroll builder.
import { ok, badRequest, serverError, readJson } from '../../_lib'
import {
  CompensationInput, MoneyValue, MathPreviewAction, InvalidCalculationInputException,
} from '@/lib/engines'
import type { NextRequest } from 'next/server'

const previewAction = new MathPreviewAction()

export async function POST(req: NextRequest) {
  try {
    const body = await readJson<{
      landValue?: string
      assetValue?: string
      yearsSinceNotification?: number
      multiplicationFactor?: string
    }>(req)
    if (!body) return badRequest('Invalid body')

    // Construct validates at construction time (per spec §4.2.2)
    const input = new CompensationInput({
      landValue: MoneyValue.from(body.landValue ?? '0'),
      assetValue: MoneyValue.from(body.assetValue ?? '0'),
      yearsSinceNotification: body.yearsSinceNotification ?? 0,
      multiplicationFactor: body.multiplicationFactor ?? '1.0000',
    })
    const result = previewAction.preview(input)
    return ok(result)
  } catch (e) {
    if (e instanceof InvalidCalculationInputException) {
      return badRequest(e.message)
    }
    return serverError('Math preview failed', e instanceof Error ? e.message : String(e))
  }
}
