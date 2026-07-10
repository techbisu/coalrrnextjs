import { db } from '@/lib/db'

export class TranslationService {
  static async getTranslationsForLocale(locale: string): Promise<Record<string, Record<string, string>>> {
    const language = await db.language.findUnique({
      where: { code: locale, is_active: true },
    });

    if (!language) {
      return {};
    }

    // Fetch approved translations
    const values = await db.translation_value.findMany({
      where: {
        language_id: language.id,
        status: 'approved',
      },
      include: {
        translation_key: {
          include: {
            module: true,
          }
        }
      }
    });

    const messages: Record<string, any> = {};

    for (const v of values) {
      const module_name = v.translation_key.module.name;
      const keyName = v.translation_key.key;
      
      if (!messages[module_name]) {
        messages[module_name] = {};
      }
      
      // Deep nest dot-notated keys (e.g., 'nav.dashboard.label' -> { nav: { dashboard: { label: '...' } } })
      const parts = keyName.split('.');
      let current = messages[module_name];
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) current[parts[i]] = {};
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = v.value;
    }

    return messages;
  }
}
