import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { LocalizationEngine } from '../localization/services/LocalizationEngine';

export const LOCALE_COOKIE_NAME = 'NEXT_LOCALE';
export const DEFAULT_LOCALE = 'en';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = cookieStore.get(LOCALE_COOKIE_NAME)?.value || DEFAULT_LOCALE;

  const messages = await LocalizationEngine.loadTranslations(locale);

  return {
    locale,
    messages,
    timeZone: 'Asia/Kolkata',
  };
});
