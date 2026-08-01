import type { Metadata } from 'next';
import Link from 'next/link';
import { absoluteUrl } from '@/lib/site';

const pageDescription = 'Free online mini-games — Roulette, Slot Machine, Rock Paper Scissors, Number Guess, Memory Game, Reaction Test. Play instantly in your browser with no install!';

const games = [
  { slug: 'roulette', title: 'Roulette', description: 'Random roulette with custom items', icon: '🎡', color: 'from-purple-500 to-pink-500' },
  { slug: 'slot-machine', title: 'Slot Machine', description: 'Aim for lucky 777!', icon: '🎰', color: 'from-yellow-500 to-red-500' },
  { slug: 'rock-paper-scissors', title: 'Rock Paper Scissors', description: 'Rock paper scissors against AI', icon: '✊', color: 'from-blue-500 to-cyan-500' },
  { slug: 'number-guess', title: 'Number Guess', description: 'Guess a number between 1 and 100', icon: '🔢', color: 'from-green-500 to-teal-500' },
  { slug: 'memory-game', title: 'Memory Game', description: 'Card matching brain game', icon: '🧠', color: 'from-indigo-500 to-purple-500' },
  { slug: 'reaction-test', title: 'Reaction Test', description: 'Measure your reaction speed', icon: '⚡', color: 'from-orange-500 to-yellow-500' },
];

export const metadata: Metadata = {
  title: 'Free Online Mini Games | Game Center',
  description: pageDescription,
  alternates: { canonical: absoluteUrl('/projects/games') },
};

export default function ProjectGamesPage() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">🎮 Game Center</h1>
          <p className="text-xl text-[var(--color-text-muted)]">Enjoy fun mini-games!</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <Link
              key={game.slug}
              href={`/projects/${game.slug}`}
              className="group relative overflow-hidden rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] hover:border-transparent transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
              <div className="p-6">
                <div className="text-5xl mb-4">{game.icon}</div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary-500 transition-colors">{game.title}</h3>
                <p className="text-[var(--color-text-muted)]">{game.description}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 p-6 bg-gradient-to-r from-primary-500/10 to-purple-500/10 rounded-xl border border-[var(--color-border)]">
          <p className="text-[var(--color-text-muted)]">
            All games are free and no data is saved. For the full collection including Snake, 2048, and more, visit the{' '}
            <Link href="/games" className="text-primary-500 hover:underline">Games hub</Link>.
          </p>
        </div>
      </div>
    </section>
  );
}
