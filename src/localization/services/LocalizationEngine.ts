import { LocalizationCache } from '../cache/LocalizationCache'
import { TranslationService } from './TranslationService'
import { LanguageService } from './LanguageService'

export class LocalizationEngine {
  /**
   * Loads translations for a locale.
   * Merges default locale translations with the requested locale translations
   * to ensure no missing keys cause errors (fallback).
   */
  static async loadTranslations(locale: string): Promise<Record<string, any>> {
    const cached = await LocalizationCache.getCachedTranslations(locale);
    if (cached) {
      return cached;
    }

    const targetTranslations = await TranslationService.getTranslationsForLocale(locale);
    let finalTranslations = targetTranslations;

    // Fallback logic
    const defaultLang = await LanguageService.getDefaultLanguage();
    if (defaultLang && defaultLang.code !== locale) {
      const defaultTranslations = await TranslationService.getTranslationsForLocale(defaultLang.code);
      
      // Simple deep merge (Lodash merge is better, but this works for JSON)
      const mergeDeep = (target: any, source: any) => {
        const isObject = (obj: any) => obj && typeof obj === 'object';
        if (!isObject(target) || !isObject(source)) return source;
        Object.keys(source).forEach(key => {
          const targetValue = target[key];
          const sourceValue = source[key];
          if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
            target[key] = targetValue.concat(sourceValue);
          } else if (isObject(targetValue) && isObject(sourceValue)) {
            target[key] = mergeDeep(Object.assign({}, targetValue), sourceValue);
          } else {
            target[key] = sourceValue;
          }
        });
        return target;
      };

      finalTranslations = mergeDeep({ ...defaultTranslations }, targetTranslations);
    }

    await LocalizationCache.setCachedTranslations(locale, finalTranslations);
    return finalTranslations;
  }
}
