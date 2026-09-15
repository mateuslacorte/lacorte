import { NextResponse } from 'next/server';
import { getPostBySlug } from '@/lib/blog';
import { serializePost } from '@/lib/blog-api';
import { isLanguage, parseLocale } from '@/i18n';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const url = new URL(request.url);
  const lang = parseLocale(url.searchParams.get('lang'));
  const givenLang = url.searchParams.get('lang');

  if (givenLang !== null && !isLanguage(givenLang)) {
    return NextResponse.json({ error: `Unsupported lang: ${givenLang}` }, { status: 400 });
  }

  const post = getPostBySlug(slug, lang);
  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  const response = NextResponse.json({ post: serializePost(post) }, { status: 200 });
  response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  return response;
}