import { NextResponse } from 'next/server';
import { getAllPosts } from '@/lib/blog';
import { summarize } from '@/lib/blog-api';
import { isLanguage, parseLocale } from '@/i18n';

export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function parseLimit(value: string | null, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.floor(parsed), 1), MAX_LIMIT);
}

function parseOffset(value: string | null): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(Math.floor(parsed), 0);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lang = parseLocale(url.searchParams.get('lang'));
  const givenLang = url.searchParams.get('lang');
  const tag = url.searchParams.get('tag')?.trim() ?? null;
  const limit = parseLimit(url.searchParams.get('limit'), DEFAULT_LIMIT);
  const offset = parseOffset(url.searchParams.get('offset'));

  if (givenLang !== null && !isLanguage(givenLang)) {
    return NextResponse.json({ error: `Unsupported lang: ${givenLang}` }, { status: 400 });
  }

  let posts = getAllPosts(lang);
  if (tag) {
    posts = posts.filter((post) => post.data.tags.includes(tag));
  }

  const total = posts.length;
  const page = posts.slice(offset, offset + limit).map(summarize);

  const response = NextResponse.json({ posts: page, total, limit, offset }, { status: 200 });
  response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  return response;
}