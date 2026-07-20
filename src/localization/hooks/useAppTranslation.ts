import { useTranslations } from 'next-intl';

/**
 * A custom hook wrapping `useTranslations` from next-intl.
 * Business components should always use this instead of raw next-intl.
 * @param module_name The module namespace to load translations from (e.g., 'common')
 */
export function useAppTranslation(module_name?: string) {
  // Use global translations to support cross-namespace keys (e.g. 'common.edit' inside 'project_master')
  const tGlobal = useTranslations();
  
  return function t(key: string, variablesOrFallback?: any, fallbackStr?: string) {
    let fullKey = key;
    // Known module namespaces in the application
    const KNOWN_MODULES = ['common', 'project_master', 'admin', 'iam', 'auth', 'land_acquisition'];
    
    // Auto-prepend module name if the key doesn't already start with a known module prefix
    // This handles both `t('title')` -> `project_master.title` 
    // AND `t('shell.loading')` -> `common.shell.loading`
    const keyPrefix = key.split('.')[0];
    if (module_name && !KNOWN_MODULES.includes(keyPrefix)) {
      fullKey = `${module_name}.${key}`;
    }

    let vars = undefined;
    let fallback = key;
    
    // Support t('key', 'Fallback text') pattern commonly used in this codebase
    if (typeof variablesOrFallback === 'string') {
      fallback = variablesOrFallback;
    } else if (typeof variablesOrFallback === 'object' && variablesOrFallback !== null) {
      vars = variablesOrFallback;
      if (variablesOrFallback.defaultValue) {
        fallback = variablesOrFallback.defaultValue;
      }
    }
    
    if (typeof fallbackStr === 'string') {
      fallback = fallbackStr;
    }

    try {
      const val = tGlobal(fullKey, vars);
      // next-intl returns the key if missing based on our getMessageFallback
      // In case getMessageFallback is buggy on client side, we also check for undefined. prefix
      if (val === fullKey || val === key || val === `undefined.${fullKey}` || val === `undefined.${key}`) {
        return fallback;
      }
      return val;
    } catch (e) {
      return fallback;
    }
  };
}
