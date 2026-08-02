import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import ToolPageClient from '@/components/tools/ToolPageClient';
import { getToolBySlug, toolsConfig } from '@/data/tools';
import { getToolComponent } from '@/components/tools/registry';
import { parseLocale, t } from '@/i18n';
import { commonTranslations } from '@/i18n/translations/common';
import { breadcrumbJsonLd, webApplicationJsonLd } from '@/lib/jsonLd';
import { localeAlternates, localeOpenGraph } from '@/lib/localeMetadata';

interface ToolPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export function generateStaticParams() {
  return toolsConfig.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const lang = parseLocale(locale);
  const tool = getToolBySlug(slug);
  if (!tool) return {};

  const seo = tool.seo[lang];
  const urlPath = `/tools/${slug}`;
  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    alternates: localeAlternates(urlPath, lang),
    openGraph: localeOpenGraph(lang, {
      title: seo.title,
      description: seo.description,
      urlPath,
    }),
  };
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { locale, slug } = await params;
  const lang = parseLocale(locale);
  const tool = getToolBySlug(slug);

  if (!tool || !getToolComponent(slug)) {
    notFound();
  }

  const seo = tool.seo[lang];
  const nav = commonTranslations.nav;

  const structuredData = [
    webApplicationJsonLd({
      lang,
      path: `/tools/${slug}`,
      name: seo.title,
      description: seo.description,
      applicationCategory: 'UtilitiesApplication',
    }),
    breadcrumbJsonLd(
      [
        { name: t(nav.home, lang), path: '/' },
        { name: t(nav.tools, lang), path: '/tools' },
        { name: seo.title, path: `/tools/${slug}` },
      ],
      lang,
    ),
  ];

  return (
    <>
      <JsonLd data={structuredData} />
      <ToolPageClient
        slug={slug}
        title={seo.title}
        icon={tool.icon}
        description={seo.description}
        category={tool.category}
        lang={lang}
      />
    </>
  );
}
