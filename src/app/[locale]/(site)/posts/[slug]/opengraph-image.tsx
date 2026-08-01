import { ImageResponse } from 'next/og';
import { parseLocale } from '@/i18n';
import { getAllPosts, getPostBySlug } from '@/lib/blog';
import { PageOgImage, ogSize } from '@/lib/og-images';
import { SITE_NAME } from '@/lib/site';

export const alt = SITE_NAME;
export const size = ogSize;
export const contentType = 'image/png';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export function generateStaticParams() {
  return getAllPosts('en').map((post) => ({ slug: post.slug }));
}

export default async function BlogPostOpenGraphImage({ params }: Props) {
  const { locale, slug } = await params;
  const lang = parseLocale(locale);
  const post = getPostBySlug(slug, lang);

  return new ImageResponse(
    (
      <PageOgImage
        label="> BLOG"
        title={post?.data.title ?? SITE_NAME}
        description={
          post?.data.description ??
          (lang === 'pt'
            ? 'Logs de desenvolvimento, aprendizados e reflexões.'
            : 'Development logs, learnings, and thoughts.')
        }
        tags={post?.data.tags}
      />
    ),
    { ...size },
  );
}
