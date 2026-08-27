import type { SupabaseClient } from '@supabase/supabase-js';
import { getAllPosts } from '@/lib/blog';

/**
 * Titles already on the blog or in the curation pipeline — used to avoid duplicate topics.
 */
export async function loadExistingPostTitles(
  supabase: SupabaseClient,
): Promise<string[]> {
  const published = getAllPosts('en').map((post) => post.data.title.trim()).filter(Boolean);

  const { data, error } = await supabase
    .from('content_candidates')
    .select('title')
    .neq('status', 'rejected');

  if (error) {
    console.error('[curation] load existing titles failed:', error.message);
  }

  const candidates = (data ?? [])
    .map((row) => (typeof row.title === 'string' ? row.title.trim() : ''))
    .filter(Boolean);

  const seen = new Set<string>();
  const titles: string[] = [];
  for (const title of [...published, ...candidates]) {
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    titles.push(title);
  }

  return titles;
}
