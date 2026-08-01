import { ImageResponse } from 'next/og';
import { PageOgImage, ogSize } from '@/lib/og-images';

export const alt = 'Projects';
export const size = ogSize;
export const contentType = 'image/png';

export default function ProjectsOpenGraphImage() {
  return new ImageResponse(
    (
      <PageOgImage
        label="> PROJECTS"
        title="Projects"
        description="Personal projects and apps on lacorte.dev."
      />
    ),
    { ...size },
  );
}
