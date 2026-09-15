import { NextResponse } from 'next/server';
import { getAllTags } from '@/lib/blog';
import { isLanguage, parseLocale } from '@/i18n';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lang = parseLocale(url.searchParams.get('lang'));
  const givenLang = url.searchParams.get('lang');

  if (givenLang !== null && !isLanguage(givenLang)) {
    return NextResponse.json({ error: `Unsupported lang: ${givenLang}` }, { status: 400 });
  }

  const response = NextResponse.json({ tags: getAllTags(lang) }, { status: 200 });
  response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  return response;
}