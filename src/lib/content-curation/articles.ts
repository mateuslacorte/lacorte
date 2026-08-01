import type { SupabaseClient } from '@supabase/supabase-js';
import type { RecentArticleInput } from '@/lib/content-curation/types';

export function filterUnusedArticles(
  articles: RecentArticleInput[],
  usedUrls: ReadonlySet<string>,
): RecentArticleInput[] {
  return articles.filter((article) => !usedUrls.has(article.url));
}

export async function loadConsumedArticleUrls(supabase: SupabaseClient): Promise<Set<string>> {
  const { data, error } = await supabase.from('curation_consumed_articles').select('article_url');

  if (error) {
    throw new Error(error.message);
  }

  return new Set((data ?? []).map((row) => row.article_url));
}

export async function markArticlesConsumed(
  supabase: SupabaseClient,
  urls: string[],
): Promise<void> {
  if (urls.length === 0) return;

  const rows = urls.map((article_url) => ({ article_url }));
  const { error } = await supabase
    .from('curation_consumed_articles')
    .upsert(rows, { onConflict: 'article_url', ignoreDuplicates: true });

  if (error) {
    throw new Error(error.message);
  }
}

export async function loadUnusedRecentArticles(
  supabase: SupabaseClient,
  options: { limit?: number; scanLimit?: number } = {},
): Promise<RecentArticleInput[]> {
  const limit = options.limit ?? 30;
  const scanLimit = options.scanLimit ?? 150;
  const [usedUrls, batch] = await Promise.all([
    loadConsumedArticleUrls(supabase),
    loadRecentArticleRows(supabase, scanLimit),
  ]);

  return filterUnusedArticles(batch, usedUrls).slice(0, limit);
}

async function loadRecentArticleRows(
  supabase: SupabaseClient,
  scanLimit: number,
): Promise<RecentArticleInput[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('title, url, source_id, summary, published_at, fetched_at')
    .order('fetched_at', { ascending: false })
    .limit(scanLimit);

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to load articles');
  }

  const seen = new Set<string>();
  const results: RecentArticleInput[] = [];
  for (const row of data) {
    const url = row.url.trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    results.push({
      url,
      title: row.title,
      sourceId: row.source_id,
      summary: row.summary,
      publishedAt: row.published_at ?? row.fetched_at,
    });
  }

  return results;
}
