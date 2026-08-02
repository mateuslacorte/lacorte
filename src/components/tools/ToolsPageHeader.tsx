'use client';

import Link from 'next/link';
import { useTranslation } from '../../i18n/useTranslation';
import { localizePath } from '@/i18n/urlUtils';
import type { Language } from '../../i18n';

export default function ToolsPageHeader({ lang: routeLang }: { lang?: Language } = {}) {
  const { t, lang, translations } = useTranslation(routeLang);
  const tp = translations.tools.toolsPage;
  const nav = translations.common.nav;

  return (
    <>
      <nav className="text-sm mb-6">
        <ol className="flex items-center gap-2">
          <li>
            <Link
              href={localizePath('/', lang)}
              className="text-[var(--color-text-muted)] hover:text-primary-500"
            >
              {t(nav.home)}
            </Link>
          </li>
          <li className="text-[var(--color-text-muted)]">/</li>
          <li className="text-[var(--color-text)]">{t(nav.tools)}</li>
        </ol>
      </nav>
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-text)] mb-4">
          {t(tp.title)}
        </h1>
        <p className="text-[var(--color-text-muted)] text-lg">{t(tp.description)}</p>
      </header>
    </>
  );
}
