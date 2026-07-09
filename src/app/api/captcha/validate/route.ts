import { NextRequest, NextResponse } from 'next/server'
import { CaptchaService } from '@/lib/captcha/CaptchaService'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, answer } = body

    if (!id || !answer) {
      return NextResponse.json({ valid: false, reason: 'ID and answer are required' }, { status: 400 })
    }

    const ipAddress = req.ip || req.headers.get('x-forwarded-for') || undefined

    const result = await CaptchaService.validate(id, answer, ipAddress)

    // Note: Always returning 200 OK, but with { valid: false } inside the body for predictable client parsing
    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    console.error('CAPTCHA Validate Error:', error)
    return NextResponse.json({ valid: false, reason: 'Internal Server Error' }, { status: 500 })
  }
}
