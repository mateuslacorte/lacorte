import type { Metadata } from 'next';
import NumberGuess from '@/components/NumberGuess';
import { ProjectGamePage } from '@/components/projects/ProjectPageParts';

export const metadata: Metadata = {
  title: 'Number Guess',
  description: 'Guess a number between 1 and 100',
};

export default function NumberGuessProjectPage() {
  return (
    <ProjectGamePage
      slug="number-guess"
      title="Number Guess"
      icon="🔢"
      description="Guess the secret number with Up & Down hints."
      howToPlay={[
        'Enter a number between 1 and 100',
        'Use higher/lower hints to narrow it down',
        'Try to guess in as few attempts as possible',
      ]}
      Game={NumberGuess}
    />
  );
}
