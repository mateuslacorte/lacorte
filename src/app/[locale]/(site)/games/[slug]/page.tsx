import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import GamePageClient from '@/components/games/GamePageClient';
import { getGameComponent } from '@/components/games/registry';
import { gamesConfig, getGameConfig } from '@/data/games';
import { parseLocale } from '@/i18n';
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

  return (
    <GamePageClient
      slug={slug}
      title={seo.title}
      icon={game.icon}
      description={seo.description}
    />
  );
}
