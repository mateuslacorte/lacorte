import { ImageResponse } from 'next/og';
import { PageOgImage, ogSize } from '@/lib/og-images';

export const alt = 'Online Tools';
export const size = ogSize;
export const contentType = 'image/png';

export default function ToolsOpenGraphImage() {
  return new ImageResponse(
    (
      <PageOgImage
        label="> TOOLS"
        title="Online Tools"
        description="Useful web tools for developers, designers, marketers, and PMs — QR codes, passwords, converters, developer utilities, and more."
      />
    ),
    { ...size },
  );
}
