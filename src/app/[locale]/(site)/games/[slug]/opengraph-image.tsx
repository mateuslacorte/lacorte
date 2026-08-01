import { ImageResponse } from 'next/og';
import { getGameConfig } from '@/data/games';
import { parseLocale } from '@/i18n';
import { PageOgImage, ogSize } from '@/lib/og-images';
import { SITE_NAME } from '@/lib/site';

export const alt = 'Online game';
export const size = ogSize;
export const contentType = 'image/png';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function GameOpenGraphImage({ params }: Props) {
  const { locale, slug } = await params;
  const lang = parseLocale(locale);
  const game = getGameConfig(slug);
  const seo = game?.seo[lang];

  return new ImageResponse(
    (
      <PageOgImage
        label="> GAMES"
        title={seo?.title ?? SITE_NAME}
        description={seo?.description}
        icon={game?.icon}
      />
    ),
    { ...size },
  );
}
