import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import GamePageClient from '@/components/games/GamePageClient';
import JsonLd from '@/components/JsonLd';
import { getGameComponent } from '@/components/games/registry';
import { gamesConfig, getGameConfig } from '@/data/games';
import { parseLocale, t } from '@/i18n';
import { commonTranslations } from '@/i18n/translations/common';
import { breadcrumbJsonLd, webApplicationJsonLd } from '@/lib/jsonLd';
import { localeAlternates, localeOpenGraph } from '@/lib/localeMetadata';

interface GamePageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export function generateStaticParams() {
  return gamesConfig.map((game) => ({ slug: game.slug }));
}

export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const lang = parseLocale(locale);
  const game = getGameConfig(slug);
  if (!game) return {};

  const seo = game.seo[lang];
  const urlPath = `/games/${slug}`;
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

export default async function GamePage({ params }: GamePageProps) {
  const { locale, slug } = await params;
  const lang = parseLocale(locale);
  const game = getGameConfig(slug);

  if (!game || !getGameComponent(slug)) {
    notFound();
  }

  const seo = game.seo[lang];
  const nav = commonTranslations.nav;

  const structuredData = [
    webApplicationJsonLd({
      lang,
      path: `/games/${slug}`,
      name: seo.title,
      description: seo.description,
      applicationCategory: 'GameApplication',
    }),
    breadcrumbJsonLd(
      [
        { name: t(nav.home, lang), path: '/' },
        { name: t(nav.games, lang), path: '/games' },
        { name: seo.title, path: `/games/${slug}` },
      ],
      lang,
    ),
  ];

  return (
    <>
      <JsonLd data={structuredData} />
      <GamePageClient
        slug={slug}
        title={seo.title}
        icon={game.icon}
        description={seo.description}
      />
    </>
  );
}
