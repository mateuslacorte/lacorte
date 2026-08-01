import type { Metadata } from 'next';
import Link from 'next/link';
import ShareButton from '@/components/tools/ShareButton';
import {
  gamesConfig,
  getFeaturedGames,
  getGamesByCategory,
  type GameConfig,
} from '@/data/games';
import { parseLocale, type Language } from '@/i18n';
import { localizePath } from '@/i18n/urlUtils';
import { localeAlternates, localeOpenGraph } from '@/lib/localeMetadata';
import { SITE_NAME } from '@/lib/site';

interface GamesPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: GamesPageProps): Promise<Metadata> {
  const lang = parseLocale((await params).locale);
  const title = lang === 'pt' ? 'Jogos online grátis' : 'Free Online Games';
  const description =
    lang === 'pt'
      ? 'Coleção grátis de minijogos online. Snake, 2048, Digitação, Roleta, Escada e mais.'
      : 'Free online mini-game collection. Enjoy Snake, 2048, Typing, Roulette, Ladder and more.';

  return {
    title,
    description,
    alternates: localeAlternates('/games', lang),
    openGraph: localeOpenGraph(lang, { title, description, urlPath: '/games' }),
  };
}

function GameGrid({
  games,
  lang,
  featured = false,
}: {
  games: GameConfig[];
  lang: Language;
  featured?: boolean;
}) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 ${featured ? '' : ''}`}>
      {games.map((game) => {
        const seo = game.seo[lang];
        return (
          <Link
            key={game.slug}
            href={localizePath(`/games/${game.slug}`, lang)}
            className={`group p-4 rounded-xl border transition-all hover:shadow-lg hover:-translate-y-1 ${
              featured
                ? 'bg-gradient-to-br from-primary-500/10 to-purple-500/10 border-primary-500/30 hover:border-primary-500'
                : 'bg-[var(--color-card)] border-[var(--color-border)] hover:border-primary-500'
            }`}
          >
            <div className={`${featured ? 'text-4xl' : 'text-3xl'} mb-2 md:mb-3`}>{game.icon}</div>
            <h3 className={`font-bold group-hover:text-primary-500 transition-colors ${featured ? 'mb-1' : 'text-sm'}`}>
              {seo.title.split(' - ')[0]}
            </h3>
            {featured && (
              <p className="text-sm text-[var(--color-text-muted)] line-clamp-2">
                {seo.description.slice(0, 60)}...
              </p>
            )}
          </Link>
        );
      })}
    </div>
  );
}

export default async function GamesPage({ params }: GamesPageProps) {
  const lang = parseLocale((await params).locale);
  const featuredGames = getFeaturedGames();
  const arcadeGames = getGamesByCategory('arcade');
  const puzzleGames = getGamesByCategory('puzzle');
  const eventGames = getGamesByCategory('event');
  const classicGames = getGamesByCategory('classic');

  const title =
    lang === 'pt' ? `Jogos online grátis | ${SITE_NAME}` : `Free Online Games | ${SITE_NAME}`;
  const description =
    lang === 'pt'
      ? 'Coleção grátis de minijogos online. Snake, 2048, Digitação, Roleta, Escada e mais.'
      : 'Free online mini-game collection. Enjoy Snake, 2048, Typing, Roulette, Ladder and more.';

  const labels =
    lang === 'pt'
      ? {
          heading: 'Jogos online grátis',
          subtitle: 'Minijogos que você joga direto no navegador',
          featured: 'Jogos em destaque',
          arcade: 'Jogos arcade',
          puzzle: 'Puzzle / Jogos mentais',
          event: 'Eventos / Sorteios',
          classic: 'Jogos clássicos',
        }
      : {
          heading: 'Free Online Games',
          subtitle: 'Mini games you can play directly in your browser',
          featured: 'Featured Games',
          arcade: 'Arcade Games',
          puzzle: 'Puzzle / Brain Games',
          event: 'Event / Raffle',
          classic: 'Classic Games',
        };

  return (
    <section className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary-500 to-purple-500 bg-clip-text text-transparent">
              {labels.heading}
            </h1>
            <ShareButton title={title} description={description} />
          </div>
          <p className="text-lg text-[var(--color-text-muted)]">{labels.subtitle}</p>
        </div>

        {featuredGames.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span>⭐</span> {labels.featured}
            </h2>
            <GameGrid games={featuredGames} lang={lang} featured />
          </div>
        )}

        {arcadeGames.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span>🕹️</span> {labels.arcade}
            </h2>
            <GameGrid games={arcadeGames} lang={lang} />
          </div>
        )}

        {puzzleGames.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span>🧩</span> {labels.puzzle}
            </h2>
            <GameGrid games={puzzleGames} lang={lang} />
          </div>
        )}

        {eventGames.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span>🎉</span> {labels.event}
            </h2>
            <GameGrid games={eventGames} lang={lang} />
          </div>
        )}

        {classicGames.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span>🎮</span> {labels.classic}
            </h2>
            <GameGrid games={classicGames} lang={lang} />
          </div>
        )}
      </div>
    </section>
  );
}
