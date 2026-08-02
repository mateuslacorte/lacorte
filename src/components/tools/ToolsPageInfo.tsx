'use client';

import { useTranslation } from '../../i18n/useTranslation';
import type { Language } from '../../i18n';

export default function ToolsPageInfo({ lang }: { lang?: Language } = {}) {
  const { t, translations } = useTranslation(lang);
  const tp = translations.tools.toolsPage;

  const infoItems = [tp.infoBrowser, tp.infoFree, tp.infoDevices, tp.infoLocale];

  return (
    <div className="mt-8 p-6 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)]">
      <h2 className="text-xl font-semibold text-[var(--color-text)] mb-4">
        ℹ️ {t(tp.infoHeading)}
      </h2>
      <ul className="space-y-2 text-[var(--color-text-muted)]">
        {infoItems.map((item, index) => (
          <li key={index}>• {t(item)}</li>
        ))}
      </ul>
    </div>
  );
}
