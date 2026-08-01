import { ImageResponse } from 'next/og';
import { PageOgImage, ogSize } from '@/lib/og-images';

export const alt = 'Blog';
export const size = ogSize;
export const contentType = 'image/png';

export default function BlogOpenGraphImage() {
  return new ImageResponse(
    (
      <PageOgImage
        label="> BLOG"
        title="Blog"
        description="Development logs, learnings, and thoughts."
      />
    ),
    { ...size },
  );
}
