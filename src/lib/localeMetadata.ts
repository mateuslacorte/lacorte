import type { Metadata } from 'next';
import { type Language, ogLocale } from '@/i18n';
import { hreflangAlternates, localizePath } from '@/i18n/urlUtils';
import { absoluteUrl, SITE_NAME } from '@/lib/site';

/** Shared metadata helpers for localized public pages. */
export function localeAlternates(basePath: string, lang: Language): Metadata['alternates'] {
  const languages = hreflangAlternates(basePath);
  return {
    canonical: absoluteUrl(localizePath(basePath, lang)),
    languages: {
      en: languages.en,
      'pt-BR': languages.pt,
      'x-default': languages.en,
    },
  };
}

export function localeOpenGraph(
  lang: Language,
  opts: { title: string; description: string; urlPath: string; type?: 'website' | 'article' },
): Metadata['openGraph'] {
  return {
    type: opts.type ?? 'website',
    locale: ogLocale(lang),
    url: absoluteUrl(localizePath(opts.urlPath, lang)),
    title: opts.title,
    description: opts.description,
    siteName: SITE_NAME,
  };
}
