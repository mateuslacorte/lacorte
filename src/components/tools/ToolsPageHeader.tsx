'use client';

import { useTranslation } from '../../i18n/useTranslation';
import { useState, useEffect } from 'react';
import type { Language } from '../../i18n';

export default function ToolsPageHeader({ lang }: { lang?: Language } = {}) {
  const { t } = useTranslation(lang);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show English during SSR for SEO, then switch to user's language
  if (!mounted) {
    return (
      <>
        <nav className="text-sm mb-6">
          <ol className="flex items-center gap-2">
            <li><a href="/" className="text-[var(--color-text-muted)] hover:text-primary-500">Home</a></li>
            <li className="text-[var(--color-text-muted)]">/</li>
            <li className="text-[var(--color-text)]">Tools</li>
          </ol>
        </nav>
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-text)] mb-4">
            Online Tools
          </h1>
          <p className="text-[var(--color-text-muted)] text-lg">
            A collection of useful web tools for developers, designers, marketers, and PMs. Free to use.
          </p>
        </header>
      </>
    );
  }

  return (
    <>
      <nav className="text-sm mb-6">
        <ol className="flex items-center gap-2">
          <li>
            <a href="/" className="text-[var(--color-text-muted)] hover:text-primary-500">
              {t({ en: 'Home', pt: 'Home' })}
            </a>
          </li>
          <li className="text-[var(--color-text-muted)]">/</li>
          <li className="text-[var(--color-text)]">
            {t({ en: 'Tools', pt: 'Tools' })}
          </li>
        </ol>
      </nav>
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-text)] mb-4">
          {t({ en: 'Online Tools', pt: 'Online Tools' })}
        </h1>
        <p className="text-[var(--color-text-muted)] text-lg">
          {t({ en: 'A collection of useful web tools for developers, designers, marketers, and PMs. Free to use.', pt: 'A collection of useful web tools for developers, designers, marketers, and PMs. Free to use.' })}
        </p>
      </header>
    </>
  );
}
