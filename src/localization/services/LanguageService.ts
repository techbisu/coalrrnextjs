import { db } from '@/lib/db'

export class LanguageService {
  static async getSupportedLanguages() {
    return db.language.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  static async getDefaultLanguage() {
    const defaultLang = await db.language.findFirst({
      where: { isDefault: true, isActive: true },
    });
    return defaultLang || null;
  }

  static async getLanguageByCode(code: string) {
    return db.language.findUnique({
      where: { code },
    });
  }
}
