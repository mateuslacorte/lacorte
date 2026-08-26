import { NextResponse } from 'next/server';
import { getCfCountry, getClientIp, ipVersion } from '@/lib/clientIp';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_STORE_HEADERS = {
  'Cache-Control': 'private, no-store, no-cache, max-age=0, must-revalidate',
  'CDN-Cache-Control': 'no-store',
  'Cloudflare-CDN-Cache-Control': 'no-store',
  Vary: '*',
};

export async function GET(request: Request) {
  const { headers } = request;
  const ip = getClientIp(headers);
  const version = ip ? ipVersion(ip) : null;
  const country = getCfCountry(headers);

  return NextResponse.json(
    {
      ip,
      version,
      country,
      userAgent: headers.get('user-agent') ?? null,
      acceptLanguage: headers.get('accept-language') ?? null,
    },
    {
      status: 200,
      headers: NO_STORE_HEADERS,
    },
  );
}
