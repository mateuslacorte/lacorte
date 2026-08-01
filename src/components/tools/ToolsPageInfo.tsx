'use client';

import { useTranslation } from '../../i18n/useTranslation';
import { useState, useEffect } from 'react';
import type { Language } from '../../i18n';

export default function ToolsPageInfo({ lang }: { lang?: Language } = {}) {
  const { t } = useTranslation(lang);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const infoItems = [
    { en: 'All tools run in your browser. No data is sent to any server.', pt: 'All tools run in your browser. No data is sent to any server.' },
    { en: 'Free to use. No registration required.', pt: 'Free to use. No registration required.' },
    { en: 'Works on both mobile and desktop.', pt: 'Works on both mobile and desktop.' },
    { en: 'English interface.', pt: 'English interface.' },
  ];

  return (
    <div className="mt-8 p-6 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)]">
      <h2 className="text-xl font-semibold text-[var(--color-text)] mb-4">
        {mounted ? t({ en: 'ℹ️ Information', pt: 'ℹ️ Information' }) : 'ℹ️ Information'}
      </h2>
      <ul className="space-y-2 text-[var(--color-text-muted)]">
        {infoItems.map((item, index) => (
          <li key={index}>• {mounted ? t(item) : item.en}</li>
        ))}
      </ul>
    </div>
  );
}
