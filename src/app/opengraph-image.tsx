import { ImageResponse } from 'next/og';
import { DefaultOgImage, ogSize } from '@/lib/og-images';

export const alt = 'lacorte.dev';
export const size = ogSize;
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(<DefaultOgImage />, { ...size });
}
