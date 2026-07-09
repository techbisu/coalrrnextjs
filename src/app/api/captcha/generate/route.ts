import { NextRequest, NextResponse } from 'next/server'
import { CaptchaService } from '@/lib/captcha/CaptchaService'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { purpose } = body

    if (!purpose) {
      return NextResponse.json({ error: 'Purpose is required' }, { status: 400 })
    }

    const ipAddress = req.ip || req.headers.get('x-forwarded-for') || undefined
    const userAgent = req.headers.get('user-agent') || undefined

    const result = await CaptchaService.generate(purpose, ipAddress, userAgent)

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('CAPTCHA Generate Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
