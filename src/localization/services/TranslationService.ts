import { db } from '@/lib/db'

export class TranslationService {
  static async getTranslationsForLocale(locale: string): Promise<Record<string, Record<string, string>>> {
    const language = await db.language.findUnique({
      where: { code: locale, isActive: true },
    });

    if (!language) {
      return {};
    }

    // Fetch approved translations
    const values = await db.translationValue.findMany({
      where: {
        languageId: language.id,
        status: 'approved',
      },
      include: {
        translationKey: {
          include: {
            module: true,
          }
        }
      }
    });

    const messages: Record<string, any> = {};

    for (const v of values) {
      const moduleName = v.translationKey.module.name;
      const keyName = v.translationKey.key;
      
      if (!messages[moduleName]) {
        messages[moduleName] = {};
      }
      
      // Deep nest dot-notated keys (e.g., 'nav.dashboard.label' -> { nav: { dashboard: { label: '...' } } })
      const parts = keyName.split('.');
      let current = messages[moduleName];
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) current[parts[i]] = {};
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = v.value;
    }

    return messages;
  }
}
