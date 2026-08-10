import { ImageResponse } from 'next/og';
import { parseLocale, t } from '@/i18n';
import { nestjsBackendProject as copy } from '@/i18n/translations/projects-nestjs';
import { PageOgImage, ogSize } from '@/lib/og-images';

export const alt = 'NestJS Backend';
export const size = ogSize;
export const contentType = 'image/png';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function NestjsBackendOpenGraphImage({ params }: Props) {
  const lang = parseLocale((await params).locale);

  return new ImageResponse(
    (
      <PageOgImage
        label="> PROJECTS"
        title={t(copy.title, lang)}
        description={t(copy.metaDescription, lang)}
        icon="🪺"
        tags={['nestjs', 'graphql', 'docker']}
      />
    ),
    { ...size },
  );
}
