import type { Metadata } from 'next';
import SlotMachine from '@/components/SlotMachine';
import { ProjectGamePage } from '@/components/projects/ProjectPageParts';

export const metadata: Metadata = {
  title: 'Slot Machine',
  description: 'Aim for lucky 777!',
};

export default function SlotMachineProjectPage() {
  return (
    <ProjectGamePage
      slug="slot-machine"
      title="Slot Machine"
      icon="🎰"
      description="Try your luck for a 777 jackpot!"
      howToPlay={[
        'Pull the lever to spin the reels',
        'Match three symbols to win',
        'Aim for triple 7s for the jackpot',
      ]}
      Game={SlotMachine}
    />
  );
}
