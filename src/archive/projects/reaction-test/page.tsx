import type { Metadata } from 'next';
import ReactionTest from '@/components/ReactionTest';
import { ProjectGamePage } from '@/components/projects/ProjectPageParts';

export const metadata: Metadata = {
  title: 'Reaction Test',
  description: 'Measure your reaction speed',
};

export default function ReactionTestProjectPage() {
  return (
    <ProjectGamePage
      slug="reaction-test"
      title="Reaction Test"
      icon="⚡"
      description="Measure your reaction speed in milliseconds."
      howToPlay={[
        'Wait for the screen to turn green',
        'Click as fast as you can when it changes',
        'Average human reaction time is 200–250ms',
      ]}
      Game={ReactionTest}
    />
  );
}
