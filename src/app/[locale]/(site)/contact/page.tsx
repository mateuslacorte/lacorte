import type { Metadata } from 'next';
import { parseLocale, t } from '@/i18n';
import { pageTranslations } from '@/i18n/translations/pages';
import { localeAlternates, localeOpenGraph } from '@/lib/localeMetadata';

const p = pageTranslations.contact;

interface ContactPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ContactPageProps): Promise<Metadata> {
  const lang = parseLocale((await params).locale);
  const title = t(p.title, lang);
  const description = t(p.description, lang);
  return {
    title,
    description,
    alternates: localeAlternates('/contact', lang),
    openGraph: localeOpenGraph(lang, { title, description, urlPath: '/contact' }),
  };
}

export default async function ContactPage({ params }: ContactPageProps) {
  const lang = parseLocale((await params).locale);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16 md:py-20">
      <header className="mb-12 space-y-4">
        <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">CONTACT</p>
        <h1 className="text-4xl font-bold tracking-tight">{t(p.heading, lang)}</h1>
        <p className="text-lg leading-8 text-[var(--color-text-muted)]">
          {t(p.intro, lang)}
        </p>
      </header>

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 md:p-8">
        <h2 className="text-xl font-semibold">{t(p.emailHeading, lang)}</h2>
        <p className="mt-3 leading-7 text-[var(--color-text-muted)]">
          <a className="font-medium text-primary-600 hover:underline dark:text-primary-400" href="mailto:mateus@lacorte.dev">
            mateus@lacorte.dev
          </a>
        </p>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
          {t(p.emailHint, lang)}
        </p>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <a className="rounded-2xl border border-[var(--color-border)] p-6 transition-colors hover:border-primary-500" href="https://github.com/mateuslacorte" target="_blank" rel="noopener noreferrer">
          <h2 className="font-semibold">GitHub</h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">{t(p.githubHint, lang)}</p>
        </a>
        <a className="rounded-2xl border border-[var(--color-border)] p-6 transition-colors hover:border-primary-500" href="https://linkedin.com/in/mateuslacorte" target="_blank" rel="noopener noreferrer">
          <h2 className="font-semibold">LinkedIn</h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">{t(p.linkedinHint, lang)}</p>
        </a>
      </section>
    </main>
  );
}
