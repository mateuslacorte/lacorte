import { ImageResponse } from 'next/og';
import { LlmWikiOgImage, ogSize } from '@/lib/og-images';

export const runtime = 'edge';
export const alt = 'LLM Wiki interactive field guide';
export const size = ogSize;
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(<LlmWikiOgImage />, { ...size });
}
