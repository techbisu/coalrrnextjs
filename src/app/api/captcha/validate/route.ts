import { NextRequest, NextResponse } from 'next/server';
import { validateCaptchaUseCase } from '@/infrastructure/di/Container';
import { validateCaptchaSchema } from '@/modules/captcha/domain/schemas/captcha.schema';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = validateCaptchaSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { id, answer } = parsed.data;
    const ip_address = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || undefined;

    const result = await validateCaptchaUseCase.execute(id, answer, ip_address);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('CAPTCHA Validate Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
