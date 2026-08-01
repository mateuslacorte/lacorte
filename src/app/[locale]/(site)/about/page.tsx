import type { Metadata } from 'next';
import { parseLocale, t } from '@/i18n';
import { pageTranslations } from '@/i18n/translations/pages';
import { localeAlternates, localeOpenGraph } from '@/lib/localeMetadata';

const p = pageTranslations.about;

interface AboutPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
  const lang = parseLocale((await params).locale);
  const title = t(p.title, lang);
  const description = t(p.description, lang);
  return {
    title,
    description,
    alternates: localeAlternates('/about', lang),
    openGraph: localeOpenGraph(lang, { title, description, urlPath: '/about' }),
  };
}

export default async function AboutPage({ params }: AboutPageProps) {
  const lang = parseLocale((await params).locale);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16 md:py-20">
      <header className="mb-12 space-y-4">
        <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">ABOUT LACORTE.DEV</p>
        <h1 className="text-4xl font-bold tracking-tight">{t(p.heading, lang)}</h1>
        <p className="text-lg leading-8 text-[var(--color-text-muted)]">
          {t(p.intro, lang)}
        </p>
      </header>

      <div className="space-y-10 leading-7 text-[var(--color-text-muted)]">
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-[var(--color-text)]">{t(p.topicsHeading, lang)}</h2>
          <p>{t(p.topicsBody, lang)}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-[var(--color-text)]">{t(p.principlesHeading, lang)}</h2>
          <p>{t(p.principlesBody1, lang)}</p>
          <p>{t(p.principlesBody2, lang)}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-[var(--color-text)]">{t(p.operatorHeading, lang)}</h2>
          <p>
            {t(p.operatorBody, lang)}{' '}
            <a className="font-medium text-primary-600 hover:underline dark:text-primary-400" href="https://github.com/mateuslacorte" target="_blank" rel="noopener noreferrer">GitHub</a>
            {' '}{t(p.and, lang)}{' '}
            <a className="font-medium text-primary-600 hover:underline dark:text-primary-400" href="https://www.linkedin.com/in/mateuslacorte/" target="_blank" rel="noopener noreferrer">LinkedIn</a>.
          </p>
        </section>
      </div>
    </main>
  );
}
