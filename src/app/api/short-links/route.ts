import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/server';
import {
  absoluteShortUrl,
  generateShortCode,
  normalizeTargetUrl,
} from '@/lib/shortLinks';

export const dynamic = 'force-dynamic';

const MAX_INSERT_ATTEMPTS = 6;

export async function POST(request: Request) {
  let body: { url?: string };
  try {
    body = (await request.json()) as { url?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const targetUrl = normalizeTargetUrl(body.url ?? '');
  if (!targetUrl) {
    return NextResponse.json(
      { error: 'Enter a valid http(s) URL (max 2048 characters).' },
      { status: 400 },
    );
  }

  let supabase;
  try {
    supabase = createSupabaseServiceClient();
  } catch (err) {
    console.error('[short-links] missing supabase config', err);
    return NextResponse.json({ error: 'Shortener is not configured.' }, { status: 503 });
  }

  for (let attempt = 0; attempt < MAX_INSERT_ATTEMPTS; attempt += 1) {
    const code = generateShortCode();
    const { data, error } = await supabase
      .from('short_links')
      .insert({ code, target_url: targetUrl })
      .select('code, target_url, click_count, created_at')
      .single();

    if (!error && data) {
      return NextResponse.json({
        code: data.code,
        targetUrl: data.target_url,
        shortUrl: absoluteShortUrl(data.code),
        clickCount: data.click_count,
        createdAt: data.created_at,
      });
    }

    // Unique violation — retry with a new code
    if (error?.code === '23505') continue;

    console.error('[short-links] insert failed:', error?.message);
    return NextResponse.json({ error: 'Failed to create short link.' }, { status: 500 });
  }

  return NextResponse.json({ error: 'Failed to allocate a short code.' }, { status: 500 });
}
