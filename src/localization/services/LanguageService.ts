import { db } from '@/lib/db'

export class LanguageService {
  static async getSupportedLanguages() {
    return db.language.findMany({
      where: { is_active: true },
      orderBy: { sort_order: 'asc' },
    });
  }

  static async getDefaultLanguage() {
    const defaultLang = await db.language.findFirst({
      where: { is_default: true, is_active: true },
    });
    return defaultLang || null;
  }

  static async getLanguageByCode(code: string) {
    return db.language.findUnique({
      where: { code },
    });
  }
}
