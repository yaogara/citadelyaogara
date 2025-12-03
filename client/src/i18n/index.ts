import { ref } from 'vue';
import { messages, Locale } from './messages';

const defaultLocale: Locale = 'en';
const currentLocale = ref<Locale>(defaultLocale);
const supportedLocales: Locale[] = [defaultLocale];
export const availableLocales = supportedLocales;

function isLocale(locale: unknown): locale is Locale {
  return typeof locale === 'string' && (locale === 'en' || locale === 'es');
}

type TranslateParams = Record<string, unknown> | Array<string | number>;

function resolveValue(locale: Locale, key: string): unknown {
  return key.split('.').reduce<unknown>((value, segment) => {
    if (value && typeof value === 'object') {
      return (value as Record<string, unknown>)[segment];
    }
    return undefined;
  }, messages[locale]);
}

function formatValue(value: unknown, params?: TranslateParams): string {
  const base = typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : '';

  if (!params) {
    return base;
  }

  if (Array.isArray(params)) {
    return base.replace(/\{(\d+)\}/g, (_, index: string) => {
      const replacement = params[Number(index)];
      return replacement !== undefined ? String(replacement) : '';
    });
  }

  if (typeof params === 'object') {
    return base.replace(/\{(\w+)\}/g, (_, name: string) => {
      const replacement = (params as Record<string, unknown>)[name];
      return replacement !== undefined ? String(replacement) : '';
    });
  }

  return base;
}

export function setLocale(locale: Locale): void {
  currentLocale.value = isLocale(locale) ? locale : defaultLocale;
}

export function getLocale(): Locale {
  return currentLocale.value;
}

export function t(key: string, localeOrParams?: Locale | TranslateParams, maybeParams?: TranslateParams): string {
  let locale: Locale = currentLocale.value;
  let params: TranslateParams | undefined;

  if (isLocale(localeOrParams)) {
    locale = localeOrParams;
    params = maybeParams;
  } else if (localeOrParams !== undefined) {
    params = localeOrParams as TranslateParams;
  }

  const localized = resolveValue(locale, key);
  const fallback = locale !== defaultLocale ? resolveValue(defaultLocale, key) : undefined;
  const valueToFormat = localized ?? fallback ?? key;

  return formatValue(valueToFormat, params);
}

export function updateTitle(): void {
  document.title = t('ui.title');
}

export { messages };
