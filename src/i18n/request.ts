import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { LocalizationEngine } from '../localization/services/LocalizationEngine';

export const LOCALE_COOKIE_NAME = 'NEXT_LOCALE';
export const DEFAULT_LOCALE = 'en';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = cookieStore.get(LOCALE_COOKIE_NAME)?.value || DEFAULT_LOCALE;

  const messages = await LocalizationEngine.loadTranslations(locale);

  // Provide minimum required namespaces if DB is completely empty
  if (!messages.common) messages.common = { fallback: 'true' };

  return {
    locale,
    messages,
    timeZone: 'Asia/Kolkata',
    getMessageFallback: ({namespace, key}) => key ? `${namespace}.${key}` : String(namespace),
    onError: (error) => {
      // Suppress missing message errors in console
      if (error.code === 'MISSING_MESSAGE') return;
      console.error(error);
    }
  };
});
