import type { Metadata } from 'next';
import RockPaperScissors from '@/components/RockPaperScissors';
import { ProjectGamePage } from '@/components/projects/ProjectPageParts';

export const metadata: Metadata = {
  title: 'Rock Paper Scissors',
  description: 'Rock paper scissors against AI',
};

export default function RockPaperScissorsProjectPage() {
  return (
    <ProjectGamePage
      slug="rock-paper-scissors"
      title="Rock Paper Scissors"
      icon="✊"
      description="Battle against AI in classic rock paper scissors."
      howToPlay={[
        'Choose rock, paper, or scissors',
        'Beat the AI to score a point',
        'First to win multiple rounds takes the match',
      ]}
      Game={RockPaperScissors}
    />
  );
}
