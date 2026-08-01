// i18n utility — English + Brazilian Portuguese
export const languages = {
  en: 'English',
  pt: 'Português',
} as const;

export type Language = keyof typeof languages;

export const locales = Object.keys(languages) as Language[];

export const defaultLang: Language = 'en';

export function isLanguage(value: string | null | undefined): value is Language {
  return !!value && value in languages;
}

export function parseLocale(value: string | null | undefined): Language {
  return isLanguage(value) ? value : defaultLang;
}

/** BCP 47 / HTML lang + Open Graph locale codes */
export function htmlLang(lang: Language): string {
  return lang === 'pt' ? 'pt-BR' : 'en';
}

export function ogLocale(lang: Language): string {
  return lang === 'pt' ? 'pt_BR' : 'en_US';
}

export function dateLocale(lang: Language): string {
  return lang === 'pt' ? 'pt-BR' : 'en-US';
}

/**
 * Format blog frontmatter calendar dates for display.
 * Always uses UTC so SSR (Vercel) and client browsers in other timezones
 * produce the same string — avoids React hydration #418 mismatches.
 */
export function formatPostDate(
  date: Date,
  lang: Language,
  style: 'short' | 'long' = 'short',
): string {
  return date.toLocaleDateString(dateLocale(lang), {
    year: 'numeric',
    month: style,
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** Client: locale from URL path (`/pt/...` → pt, otherwise en). */
export function getLanguage(): Language {
  if (typeof window === 'undefined') return defaultLang;
  if (/^\/pt(?=\/|$)/.test(window.location.pathname)) return 'pt';
  return defaultLang;
}

export function setLanguage(lang: Language): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('lang', lang);
  window.dispatchEvent(new CustomEvent('languageChange', { detail: lang }));
}

/** Accept full or partial locale maps; missing locales fall back to English. */
export type TranslationMap = { en: string } & Partial<Record<Language, string>>;

export function t(translations: TranslationMap, lang: Language = defaultLang): string {
  return translations[lang] || translations[defaultLang] || translations.en;
}
