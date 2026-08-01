// URL utilities for language-based routing
import { type Language, languages, defaultLang, isLanguage } from './index';
import { SITE_URL } from '@/lib/site';

/** Paths that skip locale prefix rewriting (ops / system). */
export const LOCALE_EXCLUDED_PREFIXES = [
  '/api',
  '/admin',
  '/login',
  '/auth',
  '/rss.xml',
  '/sitemap.xml',
  '/robots.txt',
  '/_next',
  '/favicon',
  '/images',
  '/opengraph-image',
] as const;

const STATIC_FILE_RE = /\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|woff2?|css|js|map)$/i;

/** True for files served from /public (must not be locale-rewritten). */
export function isStaticAssetPath(pathname: string): boolean {
  if (STATIC_FILE_RE.test(pathname)) return true;
  if (pathname === '/images' || pathname.startsWith('/images/')) return true;
  if (pathname === '/favicon' || pathname.startsWith('/favicon.') || pathname.startsWith('/favicon/')) {
    return true;
  }
  return false;
}

export function isLocaleExcludedPath(pathname: string): boolean {
  if (isStaticAssetPath(pathname)) return true;
  if (pathname === '/articles/admin' || pathname.startsWith('/articles/admin/')) {
    return true;
  }
  return LOCALE_EXCLUDED_PREFIXES.some((prefix) => {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return true;
    // /favicon.svg matches prefix /favicon
    if (prefix === '/favicon' && pathname.startsWith('/favicon.')) return true;
    return false;
  });
}

/** Detect locale from a public pathname (`/pt/...` → pt, else en when not excluded). */
export function getLocaleFromPathname(pathname: string): Language | null {
  if (isLocaleExcludedPath(pathname)) return null;
  const match = pathname.match(/^\/(pt)(?=\/|$)/);
  if (match && isLanguage(match[1])) return match[1];
  // Unprefixed public paths are English (after middleware rewrite they become /en/...)
  const enMatch = pathname.match(/^\/(en)(?=\/|$)/);
  if (enMatch) return 'en';
  return defaultLang;
}

/** Strip `/en` or `/pt` prefix from a pathname. */
export function stripLocalePrefix(pathname: string): string {
  const stripped = pathname.replace(/^\/(en|pt)(?=\/|$)/, '') || '/';
  return stripped.startsWith('/') ? stripped : `/${stripped}`;
}

/**
 * Build a public URL for a locale.
 * English is unprefixed; Portuguese uses `/pt`.
 */
export function localizePath(pathname: string, lang: Language = defaultLang): string {
  const base = stripLocalePrefix(pathname);
  const normalized = base === '/' ? '/' : base.replace(/\/$/, '') || '/';
  if (lang === defaultLang) return normalized;
  if (normalized === '/') return `/${lang}`;
  return `/${lang}${normalized}`;
}

/** Switch the current public path to another locale. */
export function switchLocalePath(pathname: string, nextLang: Language): string {
  return localizePath(stripLocalePrefix(pathname), nextLang);
}

/** Absolute hreflang alternates for a public pathname (unprefixed or /pt). */
export function hreflangAlternates(pathname: string, siteUrl: string = SITE_URL): Record<Language, string> {
  const base = stripLocalePrefix(pathname);
  return {
    en: `${siteUrl}${localizePath(base, 'en')}`,
    pt: `${siteUrl}${localizePath(base, 'pt')}`,
  };
}

export function getAlternateUrls(
  pathname: string,
  siteUrl: string = SITE_URL,
): { lang: Language; url: string }[] {
  const alts = hreflangAlternates(pathname, siteUrl);
  return (Object.keys(languages) as Language[]).map((lang) => ({
    lang,
    url: alts[lang],
  }));
}

/** Legacy alias used by older helpers. */
export function getBasePathFromUrl(pathname: string): string {
  return stripLocalePrefix(pathname);
}

export function getLanguageFromUrl(pathname: string): Language | null {
  return getLocaleFromPathname(pathname);
}

export function buildLanguageUrl(pathname: string, lang: Language = defaultLang): string {
  return localizePath(pathname, lang);
}
