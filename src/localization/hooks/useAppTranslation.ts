import { useTranslations } from 'next-intl';

/**
 * A custom hook wrapping `useTranslations` from next-intl.
 * Business components should always use this instead of raw next-intl.
 * @param module_name The module namespace to load translations from (e.g., 'common')
 */
export function useAppTranslation(module_name: string) {
  const t = useTranslations(module_name);
  return t;
}
