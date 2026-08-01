import { ImageResponse } from 'next/og';
import { PageOgImage, ogSize } from '@/lib/og-images';
import { SITE_NAME } from '@/lib/site';

export const alt = 'Free Online Games';
export const size = ogSize;
export const contentType = 'image/png';

export default function GamesOpenGraphImage() {
  return new ImageResponse(
    (
      <PageOgImage
        label="> GAMES"
        title="Free Online Games"
        description={`Free online mini-game collection on ${SITE_NAME}. Enjoy Snake, 2048, Typing, Roulette, Ladder and more.`}
      />
    ),
    { ...size },
  );
}
