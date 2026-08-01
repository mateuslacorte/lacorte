import type { Metadata } from 'next';
import { parseLocale, t } from '@/i18n';
import { pageTranslations } from '@/i18n/translations/pages';
import { localeAlternates, localeOpenGraph } from '@/lib/localeMetadata';

const p = pageTranslations.privacy;

interface PrivacyPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PrivacyPageProps): Promise<Metadata> {
  const lang = parseLocale((await params).locale);
  const title = t(p.title, lang);
  const description = t(p.description, lang);
  return {
    title,
    description,
    alternates: localeAlternates('/privacy', lang),
    openGraph: localeOpenGraph(lang, { title, description, urlPath: '/privacy' }),
  };
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const lang = parseLocale((await params).locale);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16 md:py-20">
      <header className="mb-12 space-y-4">
        <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">PRIVACY POLICY</p>
        <h1 className="text-4xl font-bold tracking-tight">{t(p.heading, lang)}</h1>
        <p className="text-sm text-[var(--color-text-muted)]">{t(p.effectiveDate, lang)}</p>
      </header>

      <div className="space-y-10 leading-7 text-[var(--color-text-muted)]">
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-[var(--color-text)]">{t(p.s1Heading, lang)}</h2>
          <p>{t(p.s1Body, lang)}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-[var(--color-text)]">{t(p.s2Heading, lang)}</h2>
          <p>{t(p.s2Body, lang)}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-[var(--color-text)]">{t(p.s3Heading, lang)}</h2>
          <p>
            {t(p.s3Body, lang)}{' '}
            <a className="font-medium text-primary-600 hover:underline dark:text-primary-400" href="https://myadcenter.google.com/" target="_blank" rel="noopener noreferrer">{t(p.adCenter, lang)}</a>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-[var(--color-text)]">{t(p.s4Heading, lang)}</h2>
          <p>{t(p.s4Body, lang)}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-[var(--color-text)]">{t(p.s5Heading, lang)}</h2>
          <p>{t(p.s5Body, lang)}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-[var(--color-text)]">{t(p.s6Heading, lang)}</h2>
          <p>
            {t(p.s6Body, lang)}{' '}
            <a className="font-medium text-primary-600 hover:underline dark:text-primary-400" href="mailto:mateus@lacorte.dev">mateus@lacorte.dev</a>.
          </p>
        </section>
      </div>
    </main>
  );
}
