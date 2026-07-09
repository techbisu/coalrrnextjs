// Fallback in-memory cache since Redis is unavailable
type CacheMap = Map<string, { data: any; expiresAt: number }>;

const globalCache: CacheMap = globalThis.localizationCache || new Map();
if (process.env.NODE_ENV !== 'production') {
  globalThis.localizationCache = globalCache;
}

export class LocalizationCache {
  private static TTL_MS = 1000 * 60 * 60; // 1 hour

  static async getCachedTranslations(locale: string): Promise<any | null> {
    const key = `i18n:${locale}`;
    const cached = globalCache.get(key);
    
    if (cached) {
      if (Date.now() < cached.expiresAt) {
        return cached.data;
      }
      globalCache.delete(key);
    }
    return null;
  }

  static async setCachedTranslations(locale: string, translations: any): Promise<void> {
    const key = `i18n:${locale}`;
    globalCache.set(key, {
      data: translations,
      expiresAt: Date.now() + this.TTL_MS,
    });
  }

  static async invalidateCache(locale?: string): Promise<void> {
    if (locale) {
      globalCache.delete(`i18n:${locale}`);
    } else {
      globalCache.clear();
    }
  }
}

// Add declaration to global object for TypeScript
declare global {
  // eslint-disable-next-line no-var
  var localizationCache: CacheMap | undefined;
}
