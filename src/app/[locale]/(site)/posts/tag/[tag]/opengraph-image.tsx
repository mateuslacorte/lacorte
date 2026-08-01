import { ImageResponse } from 'next/og';
import { parseLocale } from '@/i18n';
import { PageOgImage, ogSize } from '@/lib/og-images';

export const alt = 'Blog tag';
export const size = ogSize;
export const contentType = 'image/png';

interface Props {
  params: Promise<{ locale: string; tag: string }>;
}

export default async function BlogTagOpenGraphImage({ params }: Props) {
  const { locale, tag } = await params;
  const lang = parseLocale(locale);
  const decoded = decodeURIComponent(tag);
  const title =
    lang === 'pt' ? `Posts com a tag "${decoded}"` : `Posts tagged "${decoded}"`;
  const description =
    lang === 'pt'
      ? `Posts do blog com a tag ${decoded}.`
      : `Blog posts tagged with ${decoded}.`;

  return new ImageResponse(
    (
      <PageOgImage
        label="> BLOG / TAG"
        title={title}
        description={description}
      />
    ),
    { ...size },
  );
}
