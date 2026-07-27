import { NextRequest, NextResponse } from 'next/server';
import { generateCaptchaUseCase } from '@/infrastructure/di/Container';
import { generateCaptchaSchema } from '@/modules/captcha/domain/schemas/captcha.schema';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = generateCaptchaSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { purpose } = parsed.data;

    const ip_address = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || undefined;
    const user_agent = req.headers.get('user-agent') || undefined;

    const result = await generateCaptchaUseCase.execute(purpose, ip_address, user_agent);

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('CAPTCHA Generate Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
