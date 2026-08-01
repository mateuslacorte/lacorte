import type { Metadata } from 'next';
import { parseLocale, t } from '@/i18n';
import { pageTranslations } from '@/i18n/translations/pages';
import { localeAlternates, localeOpenGraph } from '@/lib/localeMetadata';
import JobsAggregator from '@/components/jobs/JobsAggregator';

const p = pageTranslations.jobs;

interface JobsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: JobsPageProps): Promise<Metadata> {
  const lang = parseLocale((await params).locale);
  const title = t(p.title, lang);
  const description = t(p.description, lang);
  return {
    title,
    description,
    alternates: localeAlternates('/jobs', lang),
    openGraph: localeOpenGraph(lang, { title, description, urlPath: '/jobs' }),
  };
}

export default async function JobsPage({ params }: JobsPageProps) {
  const lang = parseLocale((await params).locale);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t(p.heading, lang)}</h1>
        <p className="text-[var(--color-text-muted)]">{t(p.subtitle, lang)}</p>
      </header>
      <JobsAggregator />
    </div>
  );
}
