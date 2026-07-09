import { NextResponse } from 'next/server';
import { LanguageService } from '@/localization/services/LanguageService';

export async function GET() {
  try {
    const languages = await LanguageService.getSupportedLanguages();
    return NextResponse.json({ languages });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch languages' }, { status: 500 });
  }
}
