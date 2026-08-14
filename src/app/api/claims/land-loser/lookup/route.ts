import { NextRequest, NextResponse } from 'next/server'
import { LookupLandLoserProfileUseCase } from '@/application/use-cases/land-acquisition/claims/LookupLandLoserProfileUseCase'

const lookupUseCase = new LookupLandLoserProfileUseCase()

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const authType = (searchParams.get('authType') || 'aadhaar') as 'aadhaar' | 'epic'
    const identifier = searchParams.get('identifier') || ''

    if (!identifier) {
      return NextResponse.json({ exists: false })
    }

    const result = await lookupUseCase.execute({ authType, identifier })
    if (result.isFailure) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result.value)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Lookup failed' }, { status: 500 })
  }
}
