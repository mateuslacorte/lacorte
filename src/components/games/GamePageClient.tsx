'use client';

import ShareButton from '@/components/tools/ShareButton';
import { getGameComponent } from '@/components/games/registry';

interface GamePageClientProps {
  slug: string;
  title: string;
  icon: string;
  description: string;
}

export default function GamePageClient({
  slug,
  title,
  icon,
  description,
}: GamePageClientProps) {
  const GameComponent = getGameComponent(slug);
  const shortTitle = title.split(' - ')[0];

  if (!GameComponent) {
    return null;
  }

  return (
    <section className="py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] mb-6">
          <a href="/games" className="hover:text-primary-500 transition-colors">
            All Games
          </a>
          <span>/</span>
          <span className="text-[var(--color-text)]">{shortTitle}</span>
        </div>

        <div className="text-center mb-8">
          <div className="text-5xl mb-4">{icon}</div>
          <div className="flex items-center justify-center gap-3 mb-2">
            <h1 className="text-3xl md:text-4xl font-bold">{shortTitle}</h1>
            <ShareButton title={title} description={description} />
          </div>
          <p className="text-[var(--color-text-muted)] mb-4">{description}</p>
          <div className="flex justify-center gap-2 flex-wrap">
            <span className="px-3 py-1 text-sm bg-green-500/10 text-green-500 rounded-full">Free</span>
            <span className="px-3 py-1 text-sm bg-blue-500/10 text-blue-500 rounded-full">No Install</span>
            <span className="px-3 py-1 text-sm bg-purple-500/10 text-purple-500 rounded-full">Browser Game</span>
          </div>
        </div>

        <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-4 md:p-8">
          <GameComponent />
        </div>
      </div>
    </section>
  );
}
