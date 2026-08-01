import type { Metadata } from 'next';
import MemoryGame from '@/components/MemoryGame';
import { ProjectGamePage } from '@/components/projects/ProjectPageParts';

export const metadata: Metadata = {
  title: 'Memory Game',
  description: 'Card matching brain game',
};

export default function MemoryGameProjectPage() {
  return (
    <ProjectGamePage
      slug="memory-game"
      title="Memory Game"
      icon="🧠"
      description="Flip cards and find matching pairs! Great for brain training!"
      howToPlay={[
        'Click a card to flip it over',
        'Find two matching emoji cards in a row to score a match',
        'Match all cards to clear the game',
        'Try to finish with fewer moves and less time',
      ]}
      Game={MemoryGame}
    />
  );
}
