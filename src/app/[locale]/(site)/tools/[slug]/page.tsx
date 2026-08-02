import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ToolPageClient from '@/components/tools/ToolPageClient';
import { getToolBySlug, toolsConfig } from '@/data/tools';
import { getToolComponent } from '@/components/tools/registry';
import { parseLocale } from '@/i18n';
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

  return (
    <ToolPageClient
      slug={slug}
      title={seo.title}
      icon={tool.icon}
      description={seo.description}
      category={tool.category}
      lang={lang}
    />
  );
}
