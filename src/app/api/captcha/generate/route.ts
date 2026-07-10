import { NextRequest, NextResponse } from 'next/server'
import { CaptchaService } from '@/lib/captcha/CaptchaService'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { purpose } = body

    if (!purpose) {
      return NextResponse.json({ error: 'Purpose is required' }, { status: 400 })
    }

    const ip_address = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || undefined
    const user_agent = req.headers.get('user-agent') || undefined

    const result = await CaptchaService.generate(purpose, ip_address, user_agent)

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('CAPTCHA Generate Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
