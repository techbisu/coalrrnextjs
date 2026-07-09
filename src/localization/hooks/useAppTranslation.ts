import { useTranslations } from 'next-intl';

/**
 * A custom hook wrapping `useTranslations` from next-intl.
 * Business components should always use this instead of raw next-intl.
 * @param moduleName The module namespace to load translations from (e.g., 'common')
 */
export function useAppTranslation(moduleName: string) {
  const t = useTranslations(moduleName);
  return t;
}
