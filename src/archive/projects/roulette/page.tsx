import type { Metadata } from 'next';
import EventRoulette from '@/components/games/roulette/EventRoulette';
import { ProjectGamePage } from '@/components/projects/ProjectPageParts';

export const metadata: Metadata = {
  title: 'Roulette',
  description: 'Random roulette with custom items',
};

export default function RouletteProjectPage() {
  return (
    <ProjectGamePage
      slug="roulette"
      title="Roulette"
      icon="🎡"
      description="Add your own items and spin the wheel to pick one at random."
      howToPlay={[
        'Add items to the wheel',
        'Click spin to pick a random winner',
        'Use for lunch picks, prize draws, and more',
      ]}
      Game={EventRoulette}
    />
  );
}
