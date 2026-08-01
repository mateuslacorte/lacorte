import { NextResponse } from 'next/server';
import { sanitizeArticleText } from '@/lib/articles';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

function authorize(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

interface RssItem {
  title?: string;
  link?: string;
  description?: string;
  pubDate?: string;
}

function stripTags(value: string): string {
  return sanitizeArticleText(value);
}

function firstMatch(block: string, patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const match = block.match(pattern);
    if (!match) continue;
    const value = (match[1] || match[2] || '').trim();
    if (value) return value;
  }
  return '';
}

/** Parse RSS <item> and Atom <entry> blocks. */
function parseFeedItems(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const blocks = [
    ...(xml.match(/<item[\s\S]*?<\/item>/gi) ?? []),
    ...(xml.match(/<entry[\s\S]*?<\/entry>/gi) ?? []),
  ];

  for (const block of blocks.slice(0, 25)) {
    const title = firstMatch(block, [
      /<title[^>]*><!\[CDATA\[(.*?)\]\]><\/title>/i,
      /<title[^>]*>(.*?)<\/title>/i,
    ]);
    const link = firstMatch(block, [
      /<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i,
      /<link[^>]*>(.*?)<\/link>/i,
      /<id>(.*?)<\/id>/i,
    ]);
    const description = firstMatch(block, [
      /<summary[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/summary>/i,
      /<summary[^>]*>([\s\S]*?)<\/summary>/i,
      /<content[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/content>/i,
      /<content[^>]*>([\s\S]*?)<\/content>/i,
      /<description[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i,
      /<description[^>]*>([\s\S]*?)<\/description>/i,
    ]);
    const pubDate = firstMatch(block, [
      /<pubDate>(.*?)<\/pubDate>/i,
      /<published>(.*?)<\/published>/i,
      /<updated>(.*?)<\/updated>/i,
      /<dc:date>(.*?)<\/dc:date>/i,
    ]);

    items.push({
      title,
      link,
      description: stripTags(description),
      pubDate: pubDate || undefined,
    });
  }

  return items;
}

export async function GET(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createSupabaseServiceClient();
    const { data: sources, error: sourcesError } = await supabase
      .from('article_sources')
      .select('id, feed_url');

    if (sourcesError) throw sourcesError;

    let upserted = 0;
    let sourcesFetched = 0;
    for (const source of sources ?? []) {
      if (!source.feed_url) continue;
      try {
        const res = await fetch(source.feed_url, {
          headers: { 'User-Agent': 'lacorte.dev/1.0 (+https://www.lacorte.dev)' },
          next: { revalidate: 0 },
        });
        if (!res.ok) continue;
        const xml = await res.text();
        const items = parseFeedItems(xml);
        sourcesFetched += 1;

        for (const item of items) {
          if (!item.title || !item.link) continue;
          const publishedAt = item.pubDate ? new Date(item.pubDate) : null;
          const { error } = await supabase.from('articles').upsert(
            {
              source_id: source.id,
              title: sanitizeArticleText(item.title, 0),
              url: item.link,
              summary: item.description ? sanitizeArticleText(item.description) : null,
              published_at:
                publishedAt && !Number.isNaN(publishedAt.getTime())
                  ? publishedAt.toISOString()
                  : null,
              fetched_at: new Date().toISOString(),
            },
            { onConflict: 'url', ignoreDuplicates: false },
          );
          if (!error) upserted += 1;
        }
      } catch (feedErr) {
        console.warn('[cron/articles] feed failed', source.id, feedErr);
      }
    }

    return NextResponse.json({ ok: true, upserted, sourcesFetched, sources: sources?.length ?? 0 });
  } catch (err) {
    console.error('[cron/articles]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed' },
      { status: 500 },
    );
  }
}
