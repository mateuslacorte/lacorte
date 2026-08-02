import type { ComponentType, ReactNode } from 'react';
import Link from 'next/link';

interface ProjectGamePageProps {
  slug: string;
  title: string;
  icon: string;
  description: string;
  howToPlay: string[];
  Game: ComponentType;
}

export function ProjectGamePage({
  slug,
  title,
  icon,
  description,
  howToPlay,
  Game,
}: ProjectGamePageProps) {
  return (
    <section className="py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] mb-2">
            <Link href="/projects/games" className="hover:text-primary-500">Game Center</Link>
            <span>/</span>
            <span>{title}</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">{icon} {title}</h1>
          <p className="text-[var(--color-text-muted)]">{description}</p>
        </div>

        <Game />

        <div className="mt-12 p-6 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)]">
          <h2 className="text-lg font-bold mb-4">💡 How to Play</h2>
          <ul className="space-y-2 text-[var(--color-text-muted)]">
            {howToPlay.map((line) => (
              <li key={line}>• {line}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function ProjectBreadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-8 text-sm text-[var(--color-text-muted)] flex items-center gap-2 flex-wrap">
      {items.map((item, index) => (
        <span key={item.label} className="flex items-center gap-2">
          {index > 0 && <span aria-hidden="true">/</span>}
          {item.href ? (
            <Link href={item.href} className="hover:text-[var(--color-text)] transition-colors">{item.label}</Link>
          ) : (
            <span className="text-[var(--color-text)]" aria-current="page">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export { default as JsonLd } from '@/components/JsonLd';

export function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-[var(--color-text-muted)]">{description}</p>
    </div>
  );
}

export type { ReactNode };
