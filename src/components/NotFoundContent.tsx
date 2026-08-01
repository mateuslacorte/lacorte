'use client';

import { useTranslation } from '../i18n/useTranslation';

export default function NotFoundContent() {
  const { t, translations } = useTranslation();
  const notFound = translations.common.notFound;

  return (
    <section className="py-32 px-4">
      <div className="max-w-xl mx-auto text-center">
        <div className="text-8xl mb-8">🔍</div>
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <p className="text-xl text-[var(--color-text-muted)] mb-8">
          {t(notFound.title)}
        </p>
        <a
          href="/"
          className="btn btn-primary inline-flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t(notFound.backHome)}
        </a>
      </div>
    </section>
  );
}
