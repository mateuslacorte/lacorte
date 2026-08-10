import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { parseLocale, t } from '@/i18n';
import {
  NESTJS_BACKEND_ICON,
  nestjsBackendProject as copy,
} from '@/i18n/translations/projects-nestjs';
import { PageOgImage, ogSize } from '@/lib/og-images';

export const alt = 'NestJS Backend';
export const size = ogSize;
export const contentType = 'image/png';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function NestjsBackendOpenGraphImage({ params }: Props) {
  const lang = parseLocale((await params).locale);
  const logoPath = join(process.cwd(), 'public', NESTJS_BACKEND_ICON.replace(/^\//, ''));
  const logo = await readFile(logoPath);
  const iconSrc = `data:image/png;base64,${logo.toString('base64')}`;

  return new ImageResponse(
    (
      <PageOgImage
        label="> PROJECTS"
        title={t(copy.title, lang)}
        description={t(copy.metaDescription, lang)}
        iconSrc={iconSrc}
        tags={['nestjs', 'graphql', 'docker']}
      />
    ),
    { ...size },
  );
}
