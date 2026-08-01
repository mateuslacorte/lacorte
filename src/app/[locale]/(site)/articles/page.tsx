import type { Metadata } from 'next';
import ArticleAggregator from '@/components/articles/ArticleAggregator';
import { parseLocale, t } from '@/i18n';
import { commonTranslations } from '@/i18n/translations/common';
import { pageTranslations } from '@/i18n/translations/pages';
import { localeAlternates, localeOpenGraph } from '@/lib/localeMetadata';

interface ArticlesPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ArticlesPageProps): Promise<Metadata> {
  const lang = parseLocale((await params).locale);
  const title = t(commonTranslations.nav.articles, lang);
  const description = t(pageTranslations.articles.description, lang);

  return {
    title,
    description,
    alternates: localeAlternates('/articles', lang),
    openGraph: localeOpenGraph(lang, { title, description, urlPath: '/articles' }),
  };
}

export default function ArticlesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <ArticleAggregator />
    </div>
  );
}
