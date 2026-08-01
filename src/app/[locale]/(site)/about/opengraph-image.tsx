import { ImageResponse } from 'next/og';
import { parseLocale, t } from '@/i18n';
import { pageTranslations } from '@/i18n/translations/pages';
import { PageOgImage, ogSize } from '@/lib/og-images';

export const alt = 'About';
export const size = ogSize;
export const contentType = 'image/png';

const p = pageTranslations.about;

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function AboutOpenGraphImage({ params }: Props) {
  const lang = parseLocale((await params).locale);

  return new ImageResponse(
    (
      <PageOgImage
        label="> ABOUT"
        title={t(p.heading, lang)}
        description={t(p.description, lang)}
      />
    ),
    { ...size },
  );
}
