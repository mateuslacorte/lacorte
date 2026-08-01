import { ImageResponse } from 'next/og';
import { getToolBySlug } from '@/data/tools';
import { parseLocale } from '@/i18n';
import { PageOgImage, ogSize } from '@/lib/og-images';
import { SITE_NAME } from '@/lib/site';

export const alt = 'Online tool';
export const size = ogSize;
export const contentType = 'image/png';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function ToolOpenGraphImage({ params }: Props) {
  const { locale, slug } = await params;
  const lang = parseLocale(locale);
  const tool = getToolBySlug(slug);
  const seo = tool?.seo[lang];

  return new ImageResponse(
    (
      <PageOgImage
        label="> TOOLS"
        title={seo?.title ?? SITE_NAME}
        description={seo?.description}
        icon={tool?.icon}
      />
    ),
    { ...size },
  );
}
