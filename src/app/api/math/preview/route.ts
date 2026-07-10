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
      land_value?: string
      asset_value?: string
      years_since_notification?: number
      multiplication_factor?: string
    }>(req)
    if (!body) return badRequest('Invalid body')

    // Construct validates at construction time (per spec §4.2.2)
    const input = new CompensationInput({
      land_value: MoneyValue.from(body.land_value ?? '0'),
      asset_value: MoneyValue.from(body.asset_value ?? '0'),
      years_since_notification: body.years_since_notification ?? 0,
      multiplication_factor: body.multiplication_factor ?? '1.0000',
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
